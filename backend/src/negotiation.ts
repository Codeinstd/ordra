import { PrismaClient } from "@prisma/client";
import { draftNegotiationMessage } from "./llm";

const prisma = new PrismaClient();

export async function startNegotiation(quoteId: string, targetSavingsPct: number) {
  return prisma.negotiationThread.create({
    data: { quoteId, targetSavingsPct, status: "drafting" },
  });
}

export async function generateDraft(threadId: string, vendorQuoteSummary: string, comparableQuotesSummary: string) {
  const thread = await prisma.negotiationThread.findUniqueOrThrow({ where: { id: threadId } });
  const body = await draftNegotiationMessage({
    vendorQuoteSummary,
    comparableQuotesSummary,
    targetSavingsPct: thread.targetSavingsPct ?? 10,
  });

  await prisma.negotiationThread.update({ where: { id: threadId }, data: { status: "awaiting_approval" } });
  return prisma.negotiationMessage.create({
    data: { threadId, direction: "outbound_draft", body },
  });
}

// The only path from "drafted" to "sent" — requires an explicit human
// approver, by design. There is no code path that sends an AI-drafted
// negotiation message without this call.
export async function approveAndSendDraft(messageId: string, approverId: string) {
  const message = await prisma.negotiationMessage.update({
    where: { id: messageId },
    data: { approvedById: approverId, approvedAt: new Date(), direction: "outbound_sent" },
  });
  await prisma.negotiationThread.update({ where: { id: message.threadId }, data: { status: "sent" } });

  // TODO: wire to the real mailer. Intentionally the only send path.
  console.log(`[stub email send] negotiation message ${messageId} approved by ${approverId} and sent.`);
  return message;
}

export async function recordVendorResponse(threadId: string, body: string) {
  await prisma.negotiationThread.update({ where: { id: threadId }, data: { status: "vendor_responded" } });
  return prisma.negotiationMessage.create({ data: { threadId, direction: "inbound", body } });
}
