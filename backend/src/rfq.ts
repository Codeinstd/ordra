import { PrismaClient } from "@prisma/client";
import { quoteIngestQueue } from "./queue";
import { sendEmail } from "./mailer";

const prisma = new PrismaClient();

export async function createRfq(data: {
  title: string;
  category: string;
  requesterId: string;
  budget?: number;
  specNotes?: string;
}) {
  return prisma.rfqEvent.create({ data });
}

// Drafts and (in a real deployment) sends a quote-request email to each
// vendor. Kept as an explicit, reviewable draft step rather than
// fire-and-forget — procurement officers generally want to see outreach
// before it goes out under their name.
export async function draftQuoteRequests(rfqId: string, vendorIds: string[]) {
  const rfq = await prisma.rfqEvent.findUniqueOrThrow({ where: { id: rfqId } });
  return vendorIds.map((vendorId) => ({
    vendorId,
    subject: `RFQ: ${rfq.title}`,
    body:
      `We're requesting a quote for the following:\n\n${rfq.specNotes ?? "(see attached spec)"}\n\n` +
      `Please include pricing, lead time, and warranty terms. Reply to this email or attach a formal quote.`,
  }));
}

export async function sendQuoteRequest(rfqId: string, vendorId: string, subject: string, body: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (vendor?.contactEmail) {
    await sendEmail(vendor.contactEmail, subject, body);
  } else {
    console.warn(`[rfq] vendor ${vendorId} has no contactEmail on file — quote request drafted but not sent`);
  }
  return prisma.quote.create({ data: { rfqEventId: rfqId, vendorId, status: "received" } });
}

// Called by whatever receives inbound vendor replies (an email webhook, an
// inbox-polling job, or a manual upload). Enqueues the extraction pipeline
// rather than processing inline, since document parsing + an LLM call
// shouldn't block the request thread.
export async function ingestVendorReply(quoteId: string, rawEmailText?: string, rawDocumentUrl?: string) {
  await prisma.quote.update({
    where: { id: quoteId },
    data: { rawEmailText, rawDocumentUrl, status: "extracting" },
  });
  await quoteIngestQueue.add("ingest", { quoteId });
}
