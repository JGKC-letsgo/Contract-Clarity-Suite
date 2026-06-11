import { Router } from "express";
import { db } from "@workspace/db";
import { contractVersionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListVersionsParams,
  CreateVersionParams,
  CreateVersionBody,
  GetVersionParams,
} from "@workspace/api-zod";

const router = Router();

// GET /contracts/:id/versions
router.get("/contracts/:id/versions", async (req, res) => {
  try {
    const parsed = ListVersionsParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    const versions = await db
      .select()
      .from(contractVersionsTable)
      .where(eq(contractVersionsTable.contractId, parsed.data.id))
      .orderBy(desc(contractVersionsTable.versionNumber));

    return res.json(
      versions.map((v) => ({
        ...v,
        createdAt: v.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list versions");
    return res.status(500).json({ error: "Failed to list versions" });
  }
});

// POST /contracts/:id/versions
router.post("/contracts/:id/versions", async (req, res) => {
  try {
    const params = CreateVersionParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) return res.status(400).json({ error: "Invalid id" });

    const body = CreateVersionBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: body.error.message });

    // Get latest version number
    const existing = await db
      .select()
      .from(contractVersionsTable)
      .where(eq(contractVersionsTable.contractId, params.data.id))
      .orderBy(desc(contractVersionsTable.versionNumber))
      .limit(1);

    const nextVersion = (existing[0]?.versionNumber ?? 0) + 1;

    const [version] = await db.insert(contractVersionsTable).values({
      contractId: params.data.id,
      versionNumber: nextVersion,
      content: body.data.content,
      authorName: body.data.authorName,
      changeNote: body.data.changeNote,
    }).returning();

    return res.status(201).json({
      ...version,
      createdAt: version.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create version");
    return res.status(500).json({ error: "Failed to create version" });
  }
});

// GET /contracts/:id/versions/:versionId
router.get("/contracts/:id/versions/:versionId", async (req, res) => {
  try {
    const parsed = GetVersionParams.safeParse({
      id: Number(req.params.id),
      versionId: Number(req.params.versionId),
    });
    if (!parsed.success) return res.status(400).json({ error: "Invalid params" });

    const [version] = await db
      .select()
      .from(contractVersionsTable)
      .where(eq(contractVersionsTable.id, parsed.data.versionId));

    if (!version) return res.status(404).json({ error: "Not found" });

    return res.json({
      ...version,
      createdAt: version.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get version" );
    return res.status(500).json({ error: "Failed to get version" });
  }
});

export default router;
