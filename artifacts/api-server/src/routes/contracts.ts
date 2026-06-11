import { Router } from "express";
import { db } from "@workspace/db";
import {
  contractsTable,
  contractVersionsTable,
  commentsTable,
  riskHighlightsTable,
  insertContractSchema,
} from "@workspace/db";
import { eq, desc, count, ilike, or, and } from "drizzle-orm";
import {
  CreateContractBody,
  UpdateContractBody,
  UpdateContractParams,
  DeleteContractParams,
  GetContractParams,
  ListExpiringContractsQueryParams,
  ShareContractParams,
  ListContractsQueryParams,
} from "@workspace/api-zod";

const router = Router();

const CONTRACT_TEMPLATES = [
  {
    id: "nda",
    name: "Non-Disclosure Agreement",
    description: "Standard mutual NDA for confidential business discussions",
    category: "Confidentiality",
    content: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of [DATE] by and between [PARTY A], a [STATE] corporation ("Disclosing Party"), and [PARTY B], a [STATE] corporation ("Receiving Party").

1. CONFIDENTIAL INFORMATION
"Confidential Information" means any information disclosed by Disclosing Party to Receiving Party that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure.

2. OBLIGATIONS
Receiving Party agrees to: (a) hold Confidential Information in strict confidence; (b) not disclose Confidential Information to any third parties without prior written consent; (c) use Confidential Information solely for evaluating a potential business relationship; and (d) protect Confidential Information using at least the same degree of care it uses to protect its own confidential information, but no less than reasonable care.

3. EXCLUSIONS
Obligations do not apply to information that: (a) is or becomes publicly known without breach of this Agreement; (b) was rightfully known before disclosure; (c) is independently developed without use of Confidential Information; or (d) is required to be disclosed by law or court order.

4. TERM
This Agreement shall remain in effect for three (3) years from the date of execution.

5. RETURN OF INFORMATION
Upon request, Receiving Party shall promptly return or destroy all Confidential Information and certify in writing that it has done so.

6. GOVERNING LAW
This Agreement shall be governed by the laws of the State of [STATE].

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

[PARTY A]
By: ____________________
Name: __________________
Title: ___________________
Date: ___________________

[PARTY B]
By: ____________________
Name: __________________
Title: ___________________
Date: ___________________`,
  },
  {
    id: "msa",
    name: "Master Services Agreement",
    description: "Comprehensive MSA for ongoing professional services",
    category: "Services",
    content: `MASTER SERVICES AGREEMENT

This Master Services Agreement ("Agreement") is entered into as of [DATE] by and between [CLIENT NAME] ("Client") and [VENDOR NAME] ("Service Provider").

1. SERVICES
Service Provider agrees to perform services ("Services") as described in one or more Statements of Work ("SOW") executed by the parties. Each SOW is incorporated into this Agreement by reference.

2. PAYMENT
Client shall pay Service Provider the fees specified in each SOW within thirty (30) days of invoice. Late payments shall accrue interest at 1.5% per month. Service Provider may suspend Services for invoices overdue by more than sixty (60) days.

3. INTELLECTUAL PROPERTY
Work product created by Service Provider specifically for Client under this Agreement ("Work Product") shall be owned by Client upon full payment. Service Provider retains ownership of all pre-existing materials and tools used in delivering Services.

4. CONFIDENTIALITY
Each party agrees to hold the other's confidential information in strict confidence and not disclose it to third parties without prior written consent.

5. WARRANTIES
Service Provider warrants that Services will be performed in a professional and workmanlike manner consistent with industry standards.

6. LIMITATION OF LIABILITY
NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. EACH PARTY'S TOTAL LIABILITY SHALL NOT EXCEED THE FEES PAID IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.

7. INDEMNIFICATION
Each party shall indemnify and hold harmless the other from third-party claims arising from its breach of this Agreement or gross negligence.

8. TERM AND TERMINATION
This Agreement commences on the effective date and continues until terminated. Either party may terminate for convenience with thirty (30) days written notice, or immediately for material breach.

9. GOVERNING LAW
This Agreement shall be governed by the laws of the State of [STATE].

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

[CLIENT NAME]                          [VENDOR NAME]
By: __________________                By: __________________
Name: ________________                Name: ________________
Title: _________________               Title: _________________`,
  },
  {
    id: "sla",
    name: "Service Level Agreement",
    description: "SLA defining uptime, response time, and support commitments",
    category: "Operations",
    content: `SERVICE LEVEL AGREEMENT

This Service Level Agreement ("SLA") is entered into as of [DATE] between [PROVIDER NAME] ("Provider") and [CUSTOMER NAME] ("Customer").

1. SERVICE AVAILABILITY
Provider shall maintain Service availability of 99.9% measured monthly ("Uptime Commitment"), excluding Scheduled Maintenance. Downtime is measured from the time Customer reports an incident to the time Service is restored.

2. SCHEDULED MAINTENANCE
Provider shall provide at least 48 hours advance notice of Scheduled Maintenance. Maintenance windows shall not exceed 4 hours per month and shall occur between 2:00 AM and 6:00 AM local time.

3. INCIDENT RESPONSE TIMES
Priority 1 (Critical - Service Unavailable): Initial response within 15 minutes; resolution target 4 hours.
Priority 2 (High - Major Feature Impaired): Initial response within 1 hour; resolution target 8 hours.
Priority 3 (Medium - Minor Feature Impaired): Initial response within 4 hours; resolution target 48 hours.
Priority 4 (Low - General Inquiry): Initial response within 1 business day; resolution target 5 business days.

4. SERVICE CREDITS
If Provider fails to meet the Uptime Commitment, Customer is eligible for Service Credits:
- 99.0% - 99.9% availability: 10% credit
- 95.0% - 99.0% availability: 25% credit
- Below 95.0% availability: 50% credit
Service Credits are Customer's sole remedy for availability failures.

5. EXCLUSIONS
SLA does not apply to unavailability caused by: Customer's acts or omissions; third-party services beyond Provider's control; force majeure events; or Customer's failure to comply with technical requirements.

6. REPORTING
Provider shall provide monthly availability reports within 5 business days of month end.

7. TERM
This SLA shall remain in effect for the duration of the Service Agreement and renews automatically.

[PROVIDER NAME]                        [CUSTOMER NAME]
By: __________________                By: __________________`,
  },
  {
    id: "employment",
    name: "Employment Agreement",
    description: "Standard at-will employment agreement with compensation and IP terms",
    category: "Employment",
    content: `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into as of [START DATE] between [COMPANY NAME] ("Company") and [EMPLOYEE NAME] ("Employee").

1. POSITION AND DUTIES
Company hereby employs Employee as [JOB TITLE]. Employee shall perform duties as assigned by Company and devote full working time to Company's business.

2. COMPENSATION
Base Salary: $[AMOUNT] per year, payable in accordance with Company's standard payroll practices.
Bonus: Employee is eligible for an annual performance bonus of up to [X]% of base salary, at Company's discretion.
Benefits: Employee shall be eligible for Company's standard employee benefits package.
Equity: Subject to Board approval, Employee shall receive [X] stock options vesting over 4 years with a 1-year cliff.

3. AT-WILL EMPLOYMENT
Employment is at-will. Either party may terminate the employment relationship at any time, with or without cause or notice.

4. CONFIDENTIALITY
Employee agrees to hold Company's confidential information in strict confidence during and after employment. Employee may not use or disclose such information except in the performance of duties for Company.

5. INTELLECTUAL PROPERTY
All inventions, works of authorship, and other intellectual property created by Employee during employment that relate to Company's business belong exclusively to Company. Employee hereby assigns all such rights to Company.

6. NON-SOLICITATION
During employment and for one (1) year thereafter, Employee shall not solicit Company's employees or customers.

7. DISPUTE RESOLUTION
Any disputes shall be resolved by binding arbitration in [CITY, STATE] under AAA rules.

8. GOVERNING LAW
This Agreement shall be governed by the laws of the State of [STATE].

Employee acknowledges having read and understood this Agreement.

[COMPANY NAME]                         EMPLOYEE
By: __________________                Signature: ____________
Name: ________________                Name: [EMPLOYEE NAME]
Title: _________________               Date: _________________`,
  },
];

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

    // Count contracts expiring within 30 days
    const allContracts = await db.select({ expiryDate: contractsTable.expiryDate }).from(contractsTable);
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringCount = allContracts.filter(c => {
      if (!c.expiryDate) return false;
      try {
        const d = new Date(c.expiryDate);
        return d >= now && d <= in30Days;
      } catch { return false; }
    }).length;

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
      expiringCount,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get contract stats");
    return res.status(500).json({ error: "Failed to get stats" });
  }
});

// GET /contracts/expiring
router.get("/contracts/expiring", async (req, res) => {
  try {
    const parsed = ListExpiringContractsQueryParams.safeParse({
      days: req.query.days ? Number(req.query.days) : 30,
    });
    const days = parsed.success ? (parsed.data.days ?? 30) : 30;

    const contracts = await db.select().from(contractsTable).orderBy(contractsTable.expiryDate);
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const expiring = contracts
      .filter(c => {
        if (!c.expiryDate) return false;
        try {
          const d = new Date(c.expiryDate);
          return d >= now && d <= cutoff;
        } catch { return false; }
      })
      .map(c => {
        const expiry = new Date(c.expiryDate!);
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        return {
          id: c.id,
          title: c.title,
          status: c.status,
          parties: c.parties ?? null,
          expiryDate: c.expiryDate!,
          daysUntilExpiry,
          riskLevel: c.riskLevel ?? null,
        };
      })
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    return res.json(expiring);
  } catch (err) {
    req.log.error({ err }, "Failed to list expiring contracts");
    return res.status(500).json({ error: "Failed to list expiring contracts" });
  }
});

// GET /contracts/templates
router.get("/contracts/templates", async (_req, res) => {
  return res.json(CONTRACT_TEMPLATES);
});

// GET /contracts
router.get("/contracts", async (req, res) => {
  try {
    // Parse optional filters
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const statusFilter = typeof req.query.status === "string" ? req.query.status : undefined;
    const riskLevelFilter = typeof req.query.riskLevel === "string" ? req.query.riskLevel : undefined;
    const expiresWithin = req.query.expiresWithin ? Number(req.query.expiresWithin) : undefined;

    let query = db.select().from(contractsTable).$dynamic();

    const conditions = [];
    if (q) {
      conditions.push(
        or(
          ilike(contractsTable.title, `%${q}%`),
          ilike(contractsTable.parties, `%${q}%`)
        )
      );
    }
    if (statusFilter) {
      conditions.push(eq(contractsTable.status, statusFilter));
    }
    if (riskLevelFilter) {
      conditions.push(eq(contractsTable.riskLevel, riskLevelFilter));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    let contracts = await query.orderBy(desc(contractsTable.updatedAt));

    // Client-side expiry filter since date is stored as text
    if (expiresWithin) {
      const now = new Date();
      const cutoff = new Date(now.getTime() + expiresWithin * 24 * 60 * 60 * 1000);
      contracts = contracts.filter(c => {
        if (!c.expiryDate) return false;
        try {
          const d = new Date(c.expiryDate);
          return d >= now && d <= cutoff;
        } catch { return false; }
      });
    }

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
          shareToken: c.shareToken ?? null,
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
      shareToken: contract.shareToken ?? null,
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

// POST /contracts/:id/share
router.post("/contracts/:id/share", async (req, res) => {
  try {
    const parsed = ShareContractParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    const [contract] = await db.select().from(contractsTable).where(eq(contractsTable.id, parsed.data.id));
    if (!contract) return res.status(404).json({ error: "Not found" });

    // Reuse existing token or generate new one
    let token = contract.shareToken;
    if (!token) {
      token = crypto.randomUUID();
      await db.update(contractsTable).set({ shareToken: token }).where(eq(contractsTable.id, contract.id));
    }

    const host = req.headers.host ?? "localhost";
    const protocol = req.headers["x-forwarded-proto"] ?? "https";
    const url = `${protocol}://${host}/shared/${token}`;

    return res.json({ token, url });
  } catch (err) {
    req.log.error({ err }, "Failed to share contract");
    return res.status(500).json({ error: "Failed to share contract" });
  }
});

// GET /contracts/:id/export — returns printable HTML (not JSON)
router.get("/contracts/:id/export", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid id");

    const [contract] = await db.select().from(contractsTable).where(eq(contractsTable.id, id));
    if (!contract) return res.status(404).send("Not found");

    const [latestVersion] = await db
      .select()
      .from(contractVersionsTable)
      .where(eq(contractVersionsTable.contractId, id))
      .orderBy(desc(contractVersionsTable.versionNumber))
      .limit(1);

    const risks = await db.select().from(riskHighlightsTable).where(eq(riskHighlightsTable.contractId, id));

    const riskColors: Record<string, string> = {
      critical: "#dc2626",
      high: "#ea580c",
      medium: "#d97706",
      low: "#2563eb",
    };

    const risksHtml = risks.length > 0
      ? risks.map(r => `
        <div style="border-left:4px solid ${riskColors[r.riskLevel] ?? "#888"};padding:12px 16px;margin:12px 0;background:#fafafa;border-radius:0 6px 6px 0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <strong style="text-transform:capitalize">${r.category}</strong>
            <span style="font-size:11px;font-weight:700;color:${riskColors[r.riskLevel] ?? "#888"};text-transform:uppercase;padding:2px 8px;border:1px solid ${riskColors[r.riskLevel] ?? "#888"};border-radius:3px">${r.riskLevel}</span>
          </div>
          <div style="font-family:monospace;font-size:12px;color:#555;background:#f0f0f0;padding:8px;border-radius:4px;margin-bottom:8px;font-style:italic">"${r.clause}"</div>
          <div style="font-size:13px;color:#333">${r.explanation}</div>
          ${r.suggestion ? `<div style="font-size:12px;color:#166534;margin-top:8px;padding:8px;background:#f0fdf4;border-radius:4px"><strong>Suggested Fix:</strong> ${r.suggestion}</div>` : ""}
        </div>`).join("")
      : "<p style='color:#888'>No risks identified. Run AI analysis to detect risks.</p>";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Risk Report — ${contract.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; color: #111; background: #fff; padding: 48px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { color: #555; font-size: 14px; margin-bottom: 24px; font-family: monospace; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px; background: #f8f8f8; border-radius: 8px; border: 1px solid #e5e5e5; margin-bottom: 32px; font-size: 13px; }
    .meta strong { color: #666; }
    .status { display:inline-block; padding:2px 10px; border-radius:20px; font-size:12px; font-weight:600; text-transform:uppercase; }
    h2 { font-size: 18px; font-weight: 700; border-bottom: 2px solid #111; padding-bottom: 8px; margin: 32px 0 16px; font-family: sans-serif; }
    .contract-text { font-size: 14px; line-height: 1.9; white-space: pre-wrap; padding: 24px; border: 1px solid #e5e5e5; border-radius: 8px; background: #fafafa; }
    .risk-summary { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
    .risk-pill { padding:4px 14px; border-radius:20px; font-size:12px; font-weight:600; color:white; }
    @media print { body { padding: 24px; } button { display:none; } }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <h1>${contract.title}</h1>
      <div class="subtitle">Generated by Legalese — ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
    </div>
    <button onclick="window.print()" style="padding:8px 18px;background:#111;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-family:sans-serif">Print / Save PDF</button>
  </div>

  <div class="meta">
    <div><strong>Status:</strong> ${contract.status.replace("_", " ")}</div>
    <div><strong>Risk Level:</strong> ${contract.riskLevel ? `<span style="color:${riskColors[contract.riskLevel] ?? "#888"};font-weight:700;text-transform:uppercase">${contract.riskLevel}</span>` : "Not analyzed"}</div>
    <div><strong>Parties:</strong> ${contract.parties ?? "—"}</div>
    <div><strong>Effective Date:</strong> ${contract.effectiveDate ?? "—"}</div>
    <div><strong>Expiry Date:</strong> ${contract.expiryDate ?? "—"}</div>
    <div><strong>Total Risks Found:</strong> ${risks.length}</div>
  </div>

  ${contract.summaryText ? `
  <h2>Executive Summary</h2>
  <div style="font-size:14px;line-height:1.8;color:#333;padding:16px;background:#f8f8f8;border-radius:8px;border:1px solid #e5e5e5">
    ${contract.summaryText}
  </div>` : ""}

  <h2>Risk Analysis (${risks.length} findings)</h2>
  ${risksHtml}

  <h2>Contract Document</h2>
  <div class="contract-text">${(latestVersion?.content ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err) {
    req.log.error({ err }, "Failed to export contract");
    return res.status(500).send("Failed to export");
  }
});

// GET /contracts/:id
router.get("/contracts/:id", async (req, res) => {
  try {
    const parsed = GetContractParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    const [contract] = await db.select().from(contractsTable).where(eq(contractsTable.id, parsed.data.id));
    if (!contract) return res.status(404).json({ error: "Not found" });

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
      shareToken: contract.shareToken ?? null,
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
      shareToken: updated.shareToken ?? null,
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
