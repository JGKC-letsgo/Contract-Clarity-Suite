import { Router } from "express";
import { db } from "@workspace/db";
import { contractsTable, contractVersionsTable, riskHighlightsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { AnalyzeContractParams, ListRisksParams, GetContractSummaryParams, UpdateRiskParams, UpdateRiskBody, SuggestClauseParams } from "@workspace/api-zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = Router();

// POST /contracts/:id/analyze
router.post("/contracts/:id/analyze", async (req, res) => {
  try {
    const parsed = AnalyzeContractParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    const [contract] = await db.select().from(contractsTable).where(eq(contractsTable.id, parsed.data.id));
    if (!contract) return res.status(404).json({ error: "Not found" });

    const [latestVersion] = await db
      .select()
      .from(contractVersionsTable)
      .where(eq(contractVersionsTable.contractId, contract.id))
      .orderBy(desc(contractVersionsTable.versionNumber))
      .limit(1);

    if (!latestVersion) return res.status(404).json({ error: "No contract content found" });

    const prompt = `You are an expert contract attorney. Analyze the following contract and return a JSON response.

CONTRACT TEXT:
${latestVersion.content.slice(0, 12000)}

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "summary": "2-3 sentence sharp, concise summary of what this contract does",
  "riskLevel": "low|medium|high|critical",
  "risks": [
    {
      "riskLevel": "low|medium|high|critical",
      "clause": "exact verbatim clause text from the contract (keep it short, max 200 chars)",
      "explanation": "clear explanation of why this is risky and what the consequences could be",
      "category": "one of: liability, indemnification, termination, payment, intellectual_property, confidentiality, dispute_resolution, governing_law, warranties, other"
    }
  ]
}

Rules:
- Identify 3-8 risk items. Focus on the most impactful ones.
- riskLevel "critical" = immediate legal/financial danger, "high" = significant concern, "medium" = worth negotiating, "low" = minor issue
- The overall riskLevel should reflect the worst individual risk level
- Be a sharp, experienced lawyer — be direct and specific about consequences
- Do not use emojis`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
    });

    const responseText = completion.choices[0]?.message?.content ?? "";

    let analysisData: {
      summary: string;
      riskLevel: string;
      risks: Array<{
        riskLevel: string;
        clause: string;
        explanation: string;
        category: string;
      }>;
    };

    try {
      analysisData = JSON.parse(responseText);
    } catch {
      req.log.error({ responseText }, "Failed to parse AI response");
      return res.status(500).json({ error: "Failed to parse AI analysis" });
    }

    await db.delete(riskHighlightsTable).where(eq(riskHighlightsTable.contractId, contract.id));

    const insertedRisks = await Promise.all(
      (analysisData.risks ?? []).map(async (risk) => {
        const [inserted] = await db.insert(riskHighlightsTable).values({
          contractId: contract.id,
          riskLevel: risk.riskLevel,
          clause: risk.clause,
          explanation: risk.explanation,
          category: risk.category,
          negotiationStatus: "open",
          suggestion: null,
          counterProposal: null,
        }).returning();
        return inserted;
      })
    );

    await db.update(contractsTable).set({
      summaryText: analysisData.summary,
      riskLevel: analysisData.riskLevel,
      analyzed: true,
    }).where(eq(contractsTable.id, contract.id));

    return res.json({
      summary: analysisData.summary,
      riskLevel: analysisData.riskLevel,
      risks: insertedRisks.map((r) => ({
        ...r,
        suggestion: r.suggestion ?? null,
        counterProposal: r.counterProposal ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to analyze contract");
    return res.status(500).json({ error: "Failed to analyze contract" });
  }
});

// GET /contracts/:id/risks
router.get("/contracts/:id/risks", async (req, res) => {
  try {
    const parsed = ListRisksParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    const risks = await db
      .select()
      .from(riskHighlightsTable)
      .where(eq(riskHighlightsTable.contractId, parsed.data.id))
      .orderBy(desc(riskHighlightsTable.createdAt));

    return res.json(
      risks.map((r) => ({
        ...r,
        suggestion: r.suggestion ?? null,
        counterProposal: r.counterProposal ?? null,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list risks");
    return res.status(500).json({ error: "Failed to list risks" });
  }
});

// PATCH /contracts/:id/risks/:riskId — update negotiation status / counter-proposal
router.patch("/contracts/:id/risks/:riskId", async (req, res) => {
  try {
    const params = UpdateRiskParams.safeParse({
      id: Number(req.params.id),
      riskId: Number(req.params.riskId),
    });
    if (!params.success) return res.status(400).json({ error: "Invalid params" });

    const body = UpdateRiskBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: body.error.message });

    const updateData: Partial<typeof riskHighlightsTable.$inferInsert> = {};
    if (body.data.negotiationStatus !== undefined) updateData.negotiationStatus = body.data.negotiationStatus;
    if (body.data.counterProposal !== undefined) updateData.counterProposal = body.data.counterProposal;

    const [updated] = await db
      .update(riskHighlightsTable)
      .set(updateData)
      .where(eq(riskHighlightsTable.id, params.data.riskId))
      .returning();

    if (!updated) return res.status(404).json({ error: "Risk not found" });

    return res.json({
      ...updated,
      suggestion: updated.suggestion ?? null,
      counterProposal: updated.counterProposal ?? null,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update risk");
    return res.status(500).json({ error: "Failed to update risk" });
  }
});

// POST /contracts/:id/risks/:riskId/suggest — AI clause suggestion
router.post("/contracts/:id/risks/:riskId/suggest", async (req, res) => {
  try {
    const params = SuggestClauseParams.safeParse({
      id: Number(req.params.id),
      riskId: Number(req.params.riskId),
    });
    if (!params.success) return res.status(400).json({ error: "Invalid params" });

    const [risk] = await db.select().from(riskHighlightsTable).where(eq(riskHighlightsTable.id, params.data.riskId));
    if (!risk) return res.status(404).json({ error: "Risk not found" });

    const [contract] = await db.select().from(contractsTable).where(eq(contractsTable.id, params.data.id));
    if (!contract) return res.status(404).json({ error: "Contract not found" });

    const prompt = `You are an expert contract attorney. A contract has a risky clause that needs a safer replacement.

Contract: ${contract.title}
Risk Category: ${risk.category}
Risk Level: ${risk.riskLevel}
Problematic Clause: "${risk.clause}"
Why It's Risky: ${risk.explanation}

Write a safer, balanced replacement clause that protects both parties fairly. Return ONLY valid JSON (no markdown):
{
  "suggestion": "The exact replacement clause text — clear, professional, and legally balanced",
  "rationale": "1-2 sentences explaining what was changed and why this version is better"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
    });

    const responseText = completion.choices[0]?.message?.content ?? "";
    let data: { suggestion: string; rationale: string };
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(500).json({ error: "Failed to parse suggestion" });
    }

    // Save suggestion back to the risk
    await db.update(riskHighlightsTable).set({ suggestion: data.suggestion }).where(eq(riskHighlightsTable.id, risk.id));

    return res.json({
      riskId: risk.id,
      suggestion: data.suggestion,
      rationale: data.rationale ?? "",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to suggest clause");
    return res.status(500).json({ error: "Failed to generate clause suggestion" });
  }
});

// GET /contracts/:id/summary
router.get("/contracts/:id/summary", async (req, res) => {
  try {
    const parsed = GetContractSummaryParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    const [contract] = await db.select().from(contractsTable).where(eq(contractsTable.id, parsed.data.id));
    if (!contract) return res.status(404).json({ error: "Not found" });

    return res.json({
      contractId: contract.id,
      summaryText: contract.summaryText ?? null,
      riskLevel: contract.riskLevel ?? null,
      analyzed: contract.analyzed,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get summary");
    return res.status(500).json({ error: "Failed to get summary" });
  }
});

export default router;
