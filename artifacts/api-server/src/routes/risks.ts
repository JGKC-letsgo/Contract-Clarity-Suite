import { Router } from "express";
import { db } from "@workspace/db";
import { contractsTable, contractVersionsTable, riskHighlightsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { AnalyzeContractParams, ListRisksParams, GetContractSummaryParams } from "@workspace/api-zod";
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

    // Delete existing risks for this contract
    await db.delete(riskHighlightsTable).where(eq(riskHighlightsTable.contractId, contract.id));

    // Insert new risks
    const insertedRisks = await Promise.all(
      (analysisData.risks ?? []).map(async (risk) => {
        const [inserted] = await db.insert(riskHighlightsTable).values({
          contractId: contract.id,
          riskLevel: risk.riskLevel,
          clause: risk.clause,
          explanation: risk.explanation,
          category: risk.category,
        }).returning();
        return inserted;
      })
    );

    // Update contract with summary and risk level
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
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list risks");
    return res.status(500).json({ error: "Failed to list risks" });
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
