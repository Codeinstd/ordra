import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Only callable once the linked PurchaseRequest has actually cleared the
// approval engine — this is the payoff of everything upstream: a
// generated PO is worthless if it's built on an unapproved or
// unreviewed quote.
export async function generatePurchaseOrderDocument(purchaseRequestId: string) {
  const pr = await prisma.purchaseRequest.findUniqueOrThrow({
    where: { id: purchaseRequestId },
    include: { steps: true },
  });
  if (pr.status !== "approved") {
    throw new Error(`Cannot generate a PO for request ${purchaseRequestId}: status is "${pr.status}", not "approved"`);
  }

  const quote = await prisma.quote.findUniqueOrThrow({
    where: { id: pr.quoteId },
    include: { vendor: true, extractedSpecs: true },
  });

  const approvers = pr.steps
    .filter((s) => s.status === "approved")
    .map((s) => `${s.approverRole}: approved`)
    .join("\n");

  return {
    poNumber: `PO-${pr.id.slice(0, 8).toUpperCase()}`,
    vendor: quote.vendor.name,
    amount: Number(pr.amount),
    category: pr.category,
    department: pr.department,
    approvalTrail: approvers,
    lineItems: quote.extractedSpecs.map((s) => `${s.fieldKey}: ${s.value}${s.unit ? " " + s.unit : ""}`),
  };
}

// A generic, working webhook delivery — not tied to any one ERP's SDK.
// Most real ERP integrations (SAP Ariba, Coupa, NetSuite, or a middleware
// tool like Zapier/Make sitting in front of one) accept inbound data this
// way, so this is a real integration point, not a placeholder — pointing
// ERP_WEBHOOK_URL at an actual endpoint makes this actually deliver. The
// payload is HMAC-signed (when ERP_WEBHOOK_SECRET is set) the same way
// Stripe/GitHub sign outbound webhooks, so the receiver can verify it
// actually came from here. Falls back to logging when no URL is
// configured, same pattern as the mailer.
export async function exportPurchaseOrderToErp(purchaseRequestId: string) {
  const po = await generatePurchaseOrderDocument(purchaseRequestId);
  const webhookUrl = process.env.ERP_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log(`[erp-export:not-configured] ${JSON.stringify(po)}`);
    return { exported: false, delivered: false, poNumber: po.poNumber };
  }

  const payload = JSON.stringify(po);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = process.env.ERP_WEBHOOK_SECRET;
  if (secret) {
    headers["X-Signature-SHA256"] = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  }

  const res = await fetch(webhookUrl, { method: "POST", headers, body: payload, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    throw new Error(`ERP webhook responded with HTTP ${res.status}`);
  }
  return { exported: true, delivered: true, poNumber: po.poNumber };
}
