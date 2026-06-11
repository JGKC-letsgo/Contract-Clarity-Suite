import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { contractsTable } from "./contracts";

export const riskHighlightsTable = pgTable("risk_highlights", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contractsTable.id, { onDelete: "cascade" }),
  riskLevel: text("risk_level").notNull(),
  clause: text("clause").notNull(),
  explanation: text("explanation").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRiskHighlightSchema = createInsertSchema(riskHighlightsTable).omit({ id: true, createdAt: true });
export type InsertRiskHighlight = z.infer<typeof insertRiskHighlightSchema>;
export type RiskHighlight = typeof riskHighlightsTable.$inferSelect;
