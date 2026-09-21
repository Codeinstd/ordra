import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { startNegotiation, generateDraft, approveAndSendDraft, recordVendorResponse } from "../negotiation";
import { exportPurchaseOrderToErp, generatePurchaseOrderDocument } from "../po";
import { validate } from "../middleware/validate";
import { startNegotiationSchema, negotiationDraftSchema, negotiationVendorResponseSchema } from "../schemas";

const prisma = new PrismaClient();
export const negotiationRouter = Router();

// Quotes and negotiation threads don't carry organizationId directly —
// ownership is checked by walking the relation to the RFQ that does.
async function quoteBelongsToOrg(quoteId: string, organizationId: string) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, include: { rfqEvent: true } });
  return !!quote && quote.rfqEvent.organizationId === organizationId;
}

async function threadBelongsToOrg(threadId: string, organizationId: string) {
  const thread = await prisma.negotiationThread.findUnique({
    where: { id: threadId },
    include: { quote: { include: { rfqEvent: true } } },
  });
  return !!thread && thread.quote.rfqEvent.organizationId === organizationId;
}

negotiationRouter.post("/negotiations", validate(startNegotiationSchema), async (req, res) => {
  const { quoteId, targetSavingsPct } = req.body;
  if (!(await quoteBelongsToOrg(quoteId, req.user!.organizationId))) {
    return res.status(404).json({ error: "Quote not found" });
  }
  res.status(201).json(await startNegotiation(quoteId, targetSavingsPct));
});

// Full thread with messages and enough quote/vendor/RFQ context for the
// negotiation page to render without a second round trip.
negotiationRouter.get("/negotiations/:id", async (req, res) => {
  const thread = await prisma.negotiationThread.findUnique({
    where: { id: req.params.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      quote: { include: { vendor: true, rfqEvent: true } },
    },
  });
  if (!thread || thread.quote.rfqEvent.organizationId !== req.user!.organizationId) {
    return res.status(404).json({ error: "Negotiation not found" });
  }
  res.json(thread);
});

// Lets the comparison page show "Negotiate" vs "View negotiation" per
// vendor instead of always offering to start a new thread.
negotiationRouter.get("/quotes/:id/negotiations", async (req, res) => {
  if (!(await quoteBelongsToOrg(req.params.id, req.user!.organizationId))) {
    return res.status(404).json({ error: "Quote not found" });
  }
  const threads = await prisma.negotiationThread.findMany({
    where: { quoteId: req.params.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(threads);
});

negotiationRouter.post("/negotiations/:id/draft", validate(negotiationDraftSchema), async (req, res) => {
  if (!(await threadBelongsToOrg(req.params.id, req.user!.organizationId))) {
    return res.status(404).json({ error: "Negotiation not found" });
  }
  const { vendorQuoteSummary, comparableQuotesSummary } = req.body;
  res.json(await generateDraft(req.params.id, vendorQuoteSummary, comparableQuotesSummary));
});

// The only send path — requires the authenticated caller, never a
// client-supplied id, so a negotiation email can't be marked "approved
// and sent" by anyone other than whoever is actually holding the session.
negotiationRouter.post("/negotiation-messages/:id/approve-and-send", async (req, res) => {
  const message = await prisma.negotiationMessage.findUnique({
    where: { id: req.params.id },
    include: { thread: { include: { quote: { include: { rfqEvent: true } } } } },
  });
  if (!message || message.thread.quote.rfqEvent.organizationId !== req.user!.organizationId) {
    return res.status(404).json({ error: "Negotiation message not found" });
  }
  res.json(await approveAndSendDraft(req.params.id, req.user!.id));
});

negotiationRouter.post("/negotiations/:id/vendor-response", validate(negotiationVendorResponseSchema), async (req, res) => {
  if (!(await threadBelongsToOrg(req.params.id, req.user!.organizationId))) {
    return res.status(404).json({ error: "Negotiation not found" });
  }
  const { body } = req.body;
  res.status(201).json(await recordVendorResponse(req.params.id, body));
});

export const poRouter = Router();

async function purchaseRequestBelongsToOrg(id: string, organizationId: string) {
  const pr = await prisma.purchaseRequest.findUnique({ where: { id } });
  return !!pr && pr.organizationId === organizationId;
}

poRouter.get("/purchase-requests/:id/po", async (req, res) => {
  if (!(await purchaseRequestBelongsToOrg(req.params.id, req.user!.organizationId))) {
    return res.status(404).json({ error: "Purchase request not found" });
  }
  res.json(await generatePurchaseOrderDocument(req.params.id));
});

poRouter.post("/purchase-requests/:id/export", async (req, res) => {
  if (!(await purchaseRequestBelongsToOrg(req.params.id, req.user!.organizationId))) {
    return res.status(404).json({ error: "Purchase request not found" });
  }
  res.json(await exportPurchaseOrderToErp(req.params.id));
});
