import { Router } from "express";
import { db } from "@workspace/db";
import { contractsTable, contractVersionsTable, riskHighlightsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /shared/:token — read-only public contract access
router.get("/shared/:token", async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 10) return res.status(400).json({ error: "Invalid token" });

    const [contract] = await db
      .select()
      .from(contractsTable)
      .where(eq(contractsTable.shareToken, token));

    if (!contract) return res.status(404).json({ error: "Not found or token invalid" });

    const [latestVersion] = await db
      .select()
      .from(contractVersionsTable)
      .where(eq(contractVersionsTable.contractId, contract.id))
      .orderBy(desc(contractVersionsTable.versionNumber))
      .limit(1);

    const risks = await db
      .select()
      .from(riskHighlightsTable)
      .where(eq(riskHighlightsTable.contractId, contract.id))
      .orderBy(desc(riskHighlightsTable.createdAt));

    return res.json({
      id: contract.id,
      title: contract.title,
      status: contract.status,
      parties: contract.parties ?? null,
      effectiveDate: contract.effectiveDate ?? null,
      expiryDate: contract.expiryDate ?? null,
      riskLevel: contract.riskLevel ?? null,
      summaryText: contract.summaryText ?? null,
      content: latestVersion?.content ?? "",
      risks: risks.map(r => ({
        ...r,
        suggestion: r.suggestion ?? null,
        counterProposal: r.counterProposal ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get shared contract");
    return res.status(500).json({ error: "Failed to get shared contract" });
  }
});

export default router;
