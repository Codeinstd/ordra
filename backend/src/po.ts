import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Only callable once the linked PurchaseRequest has actually cleared the
// approval engine. A generated PO must always be based on an approved
// purchase request and a linked supplier quote.
export async function generatePurchaseOrderDocument(
  purchaseRequestId: string
) {
  const pr = await prisma.purchaseRequest.findUniqueOrThrow({
    where: { id: purchaseRequestId },
    include: { steps: true },
  });

  if (pr.status !== "approved") {
    throw new Error(
      `Cannot generate a PO for request ${purchaseRequestId}: status is "${pr.status}", not "approved"`
    );
  }

  // A PO cannot be generated without a supplier quote.
  if (!pr.quoteId) {
    throw new Error(
      `Cannot generate a PO for request ${purchaseRequestId}: no quote is linked`
    );
  }

  const quote = await prisma.quote.findUniqueOrThrow({
    where: { id: pr.quoteId },
    include: {
      vendor: true,
      extractedSpecs: true,
    },
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

    lineItems: quote.extractedSpecs.map(
      (s) =>
        `${s.fieldKey}: ${s.value}${s.unit ? ` ${s.unit}` : ""}`
    ),
  };
}

// TODO: Replace with a real ERP connector such as SAP Ariba, Coupa,
// NetSuite, or a CSV/EDI integration.
//
// Keeping this separate means the PO generation logic does not need
// to change when the ERP integration changes.
export async function exportPurchaseOrderToErp(
  purchaseRequestId: string
) {
  const po = await generatePurchaseOrderDocument(purchaseRequestId);

  console.log(`[stub ERP export] ${JSON.stringify(po)}`);

  return {
    exported: true,
    poNumber: po.poNumber,
  };
}