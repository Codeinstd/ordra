import { PrismaClient } from "@prisma/client";
import { submitPurchaseRequest } from "./routing-engine";

const prisma = new PrismaClient();

// The real flow is RFQ -> vendor outreach -> quote ingestion -> spec
// extraction -> comparison -> purchase request -> approval, and every step
// of that has its own endpoint already. This collapses it into one call so
// the approval engine — the part with real routing logic — can be
// exercised end to end without first standing up vendor outreach or an
// Anthropic API key just to test approvals.
export async function createAndSubmitRequest(params: {
  requesterId: string;
  organizationId: string;
  vendorName: string;
  category: string;
  department: string;
  amount: number;
}) {
  // Vendors are scoped per organization — two different companies can each
  // have their own "Acme Industrial" without colliding.
  const vendor =
    (await prisma.vendor.findFirst({ where: { organizationId: params.organizationId, name: params.vendorName } })) ??
    (await prisma.vendor.create({
      data: { organizationId: params.organizationId, name: params.vendorName, categories: [params.category] },
    }));

  const rfq = await prisma.rfqEvent.create({
    data: {
      organizationId: params.organizationId,
      title: `${params.category} request`,
      category: params.category,
      requesterId: params.requesterId,
      budget: params.amount,
    },
  });

  const quote = await prisma.quote.create({
    data: { rfqEventId: rfq.id, vendorId: vendor.id, totalPrice: params.amount, status: "ready" },
  });

  const pr = await prisma.purchaseRequest.create({
    data: {
      organizationId: params.organizationId,
      rfqId: rfq.id,
      quoteId: quote.id,
      requesterId: params.requesterId,
      amount: params.amount,
      department: params.department,
      category: params.category,
      status: "draft",
    },
  });

  await submitPurchaseRequest(pr.id);

  return prisma.purchaseRequest.findUniqueOrThrow({
    where: { id: pr.id },
    include: { steps: { include: { approver: true } } },
  });
}
