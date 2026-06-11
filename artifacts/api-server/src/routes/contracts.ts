import { Router } from "express";
import { db } from "@workspace/db";
import {
  contractsTable,
  contractVersionsTable,
  commentsTable,
  riskHighlightsTable,
  insertContractSchema,
} from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
import {
  CreateContractBody,
  UpdateContractBody,
  UpdateContractParams,
  DeleteContractParams,
  GetContractParams,
} from "@workspace/api-zod";

const router = Router();

// GET /contracts/stats — must be before /:id
router.get("/contracts/stats", async (req, res) => {
  try {
    const [total] = await db.select({ count: count() }).from(contractsTable);
    const [totalComments] = await db.select({ count: count() }).from(commentsTable);
    const [totalVersions] = await db.select({ count: count() }).from(contractVersionsTable);
    const [recentlyAnalyzed] = await db
      .select({ count: count() })
      .from(contractsTable)
      .where(eq(contractsTable.analyzed, true));

    const byStatusRows = await db
      .select({ status: contractsTable.status, count: count() })
      .from(contractsTable)
      .groupBy(contractsTable.status);

    const byRiskRows = await db
      .select({ riskLevel: contractsTable.riskLevel, count: count() })
      .from(contractsTable)
      .groupBy(contractsTable.riskLevel);

    const byStatus: Record<string, number> = {};
    for (const row of byStatusRows) {
      byStatus[row.status] = Number(row.count);
    }

    const byRiskLevel: Record<string, number> = {};
    for (const row of byRiskRows) {
      byRiskLevel[row.riskLevel ?? "unknown"] = Number(row.count);
    }

    return res.json({
      total: Number(total.count),
      byStatus,
      byRiskLevel,
      recentlyAnalyzed: Number(recentlyAnalyzed.count),
      totalComments: Number(totalComments.count),
      totalVersions: Number(totalVersions.count),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get contract stats");
    return res.status(500).json({ error: "Failed to get stats" });
  }
});

// GET /contracts
router.get("/contracts", async (req, res) => {
  try {
    const contracts = await db.select().from(contractsTable).orderBy(desc(contractsTable.updatedAt));

    const result = await Promise.all(
      contracts.map(async (c) => {
        const [vc] = await db.select({ count: count() }).from(contractVersionsTable).where(eq(contractVersionsTable.contractId, c.id));
        const [cc] = await db.select({ count: count() }).from(commentsTable).where(eq(commentsTable.contractId, c.id));
        const [rc] = await db.select({ count: count() }).from(riskHighlightsTable).where(eq(riskHighlightsTable.contractId, c.id));
        return {
          ...c,
          effectiveDate: c.effectiveDate ?? null,
          expiryDate: c.expiryDate ?? null,
          riskLevel: c.riskLevel ?? null,
          summaryText: c.summaryText ?? null,
          versionCount: Number(vc.count),
          commentCount: Number(cc.count),
          riskCount: Number(rc.count),
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        };
      })
    );

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list contracts");
    return res.status(500).json({ error: "Failed to list contracts" });
  }
});

// POST /contracts
router.post("/contracts", async (req, res) => {
  try {
    const parsed = CreateContractBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const { title, content, parties, effectiveDate, expiryDate, status } = parsed.data;

    const [contract] = await db.insert(contractsTable).values({
      title,
      status: status ?? "draft",
      parties: parties ?? null,
      effectiveDate: effectiveDate ?? null,
      expiryDate: expiryDate ?? null,
      analyzed: false,
    }).returning();

    // Create initial version
    await db.insert(contractVersionsTable).values({
      contractId: contract.id,
      versionNumber: 1,
      content,
      authorName: "Original",
      changeNote: "Initial upload",
    });

    return res.status(201).json({
      ...contract,
      effectiveDate: contract.effectiveDate ?? null,
      expiryDate: contract.expiryDate ?? null,
      riskLevel: contract.riskLevel ?? null,
      summaryText: contract.summaryText ?? null,
      versionCount: 1,
      commentCount: 0,
      riskCount: 0,
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create contract");
    return res.status(500).json({ error: "Failed to create contract" });
  }
});

// GET /contracts/:id
router.get("/contracts/:id", async (req, res) => {
  try {
    const parsed = GetContractParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    const [contract] = await db.select().from(contractsTable).where(eq(contractsTable.id, parsed.data.id));
    if (!contract) return res.status(404).json({ error: "Not found" });

    // Get latest version content
    const [latestVersion] = await db
      .select()
      .from(contractVersionsTable)
      .where(eq(contractVersionsTable.contractId, contract.id))
      .orderBy(desc(contractVersionsTable.versionNumber))
      .limit(1);

    return res.json({
      ...contract,
      effectiveDate: contract.effectiveDate ?? null,
      expiryDate: contract.expiryDate ?? null,
      riskLevel: contract.riskLevel ?? null,
      summaryText: contract.summaryText ?? null,
      content: latestVersion?.content ?? "",
      currentVersionId: latestVersion?.id ?? 0,
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get contract");
    return res.status(500).json({ error: "Failed to get contract" });
  }
});

// PATCH /contracts/:id
router.patch("/contracts/:id", async (req, res) => {
  try {
    const params = UpdateContractParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) return res.status(400).json({ error: "Invalid id" });

    const body = UpdateContractBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: body.error.message });

    const updateData: Partial<typeof contractsTable.$inferInsert> = {};
    if (body.data.title !== undefined) updateData.title = body.data.title;
    if (body.data.parties !== undefined) updateData.parties = body.data.parties;
    if (body.data.effectiveDate !== undefined) updateData.effectiveDate = body.data.effectiveDate;
    if (body.data.expiryDate !== undefined) updateData.expiryDate = body.data.expiryDate;
    if (body.data.status !== undefined) updateData.status = body.data.status;

    const [updated] = await db
      .update(contractsTable)
      .set(updateData)
      .where(eq(contractsTable.id, params.data.id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Not found" });

    const [vc] = await db.select({ count: count() }).from(contractVersionsTable).where(eq(contractVersionsTable.contractId, updated.id));
    const [cc] = await db.select({ count: count() }).from(commentsTable).where(eq(commentsTable.contractId, updated.id));
    const [rc] = await db.select({ count: count() }).from(riskHighlightsTable).where(eq(riskHighlightsTable.contractId, updated.id));

    return res.json({
      ...updated,
      effectiveDate: updated.effectiveDate ?? null,
      expiryDate: updated.expiryDate ?? null,
      riskLevel: updated.riskLevel ?? null,
      summaryText: updated.summaryText ?? null,
      versionCount: Number(vc.count),
      commentCount: Number(cc.count),
      riskCount: Number(rc.count),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update contract");
    return res.status(500).json({ error: "Failed to update contract" });
  }
});

// DELETE /contracts/:id
router.delete("/contracts/:id", async (req, res) => {
  try {
    const parsed = DeleteContractParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    await db.delete(contractsTable).where(eq(contractsTable.id, parsed.data.id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete contract");
    return res.status(500).json({ error: "Failed to delete contract" });
  }
});

export default router;
