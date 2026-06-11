import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { contractsTable } from "./contracts";

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contractsTable.id, { onDelete: "cascade" }),
  versionId: integer("version_id"),
  authorName: text("author_name").notNull(),
  text: text("text").notNull(),
  selectedText: text("selected_text"),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCommentSchema = createInsertSchema(commentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;
