import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { contractsTable } from "./contracts";

export const contractVersionsTable = pgTable("contract_versions", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contractsTable.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  content: text("content").notNull(),
  authorName: text("author_name").notNull().default("Unknown"),
  changeNote: text("change_note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertContractVersionSchema = createInsertSchema(contractVersionsTable).omit({ id: true, createdAt: true });
export type InsertContractVersion = z.infer<typeof insertContractVersionSchema>;
export type ContractVersion = typeof contractVersionsTable.$inferSelect;
