import { Router } from "express";
import { db } from "@workspace/db";
import { commentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListCommentsParams,
  CreateCommentParams,
  CreateCommentBody,
  UpdateCommentParams,
  UpdateCommentBody,
  DeleteCommentParams,
} from "@workspace/api-zod";

const router = Router();

// GET /contracts/:id/comments
router.get("/contracts/:id/comments", async (req, res) => {
  try {
    const parsed = ListCommentsParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    const comments = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.contractId, parsed.data.id))
      .orderBy(desc(commentsTable.createdAt));

    return res.json(
      comments.map((c) => ({
        ...c,
        versionId: c.versionId ?? null,
        selectedText: c.selectedText ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list comments");
    return res.status(500).json({ error: "Failed to list comments" });
  }
});

// POST /contracts/:id/comments
router.post("/contracts/:id/comments", async (req, res) => {
  try {
    const params = CreateCommentParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) return res.status(400).json({ error: "Invalid id" });

    const body = CreateCommentBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: body.error.message });

    const [comment] = await db.insert(commentsTable).values({
      contractId: params.data.id,
      versionId: body.data.versionId ?? null,
      authorName: body.data.authorName,
      text: body.data.text,
      selectedText: body.data.selectedText ?? null,
      resolved: false,
    }).returning();

    return res.status(201).json({
      ...comment,
      versionId: comment.versionId ?? null,
      selectedText: comment.selectedText ?? null,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create comment");
    return res.status(500).json({ error: "Failed to create comment" });
  }
});

// PATCH /contracts/:id/comments/:commentId
router.patch("/contracts/:id/comments/:commentId", async (req, res) => {
  try {
    const params = UpdateCommentParams.safeParse({
      id: Number(req.params.id),
      commentId: Number(req.params.commentId),
    });
    if (!params.success) return res.status(400).json({ error: "Invalid params" });

    const body = UpdateCommentBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: body.error.message });

    const updateData: Partial<typeof commentsTable.$inferInsert> = {};
    if (body.data.text !== undefined) updateData.text = body.data.text;
    if (body.data.resolved !== undefined) updateData.resolved = body.data.resolved;

    const [updated] = await db
      .update(commentsTable)
      .set(updateData)
      .where(eq(commentsTable.id, params.data.commentId))
      .returning();

    if (!updated) return res.status(404).json({ error: "Not found" });

    return res.json({
      ...updated,
      versionId: updated.versionId ?? null,
      selectedText: updated.selectedText ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update comment");
    return res.status(500).json({ error: "Failed to update comment" });
  }
});

// DELETE /contracts/:id/comments/:commentId
router.delete("/contracts/:id/comments/:commentId", async (req, res) => {
  try {
    const params = DeleteCommentParams.safeParse({
      id: Number(req.params.id),
      commentId: Number(req.params.commentId),
    });
    if (!params.success) return res.status(400).json({ error: "Invalid params" });

    await db.delete(commentsTable).where(eq(commentsTable.id, params.data.commentId));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete comment");
    return res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;
