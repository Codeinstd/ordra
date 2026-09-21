import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { createRfq, draftQuoteRequests, sendQuoteRequest, ingestVendorReply } from "../rfq";
import { buildComparisonMatrix } from "../price-comparison";
import { reviewExtractedField } from "../spec-extraction";
import { validate } from "../middleware/validate";
import { createRfqSchema, addQuoteSchema } from "../schemas";

const prisma = new PrismaClient();
export const rfqRouter = Router();

async function loadOwnedRfq(id: string, organizationId: string) {
  const rfq = await prisma.rfqEvent.findUnique({ where: { id } });
  if (!rfq || rfq.organizationId !== organizationId) return null;
  return rfq;
}

// RFQs are org-visible, not private to whoever created them — anyone in
// the org might need to see what's out for quote. Scoped to the caller's
// organization, not filtered by requester.
rfqRouter.get("/rfqs", async (req, res) => {
  const rfqs = await prisma.rfqEvent.findMany({
    where: { organizationId: req.user!.organizationId },
    include: { quotes: { include: { vendor: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(rfqs);
});

rfqRouter.post("/rfqs", validate(createRfqSchema), async (req, res) => {
  res.status(201).json(await createRfq({ ...req.body, requesterId: req.user!.id, organizationId: req.user!.organizationId }));
});

rfqRouter.post("/rfqs/:id/draft-requests", async (req, res) => {
  const owned = await loadOwnedRfq(req.params.id, req.user!.organizationId);
  if (!owned) return res.status(404).json({ error: "RFQ not found" });
  const { vendorIds } = req.body as { vendorIds: string[] };
  res.json(await draftQuoteRequests(req.params.id, vendorIds));
});

rfqRouter.post("/rfqs/:id/send-requests", async (req, res) => {
  const owned = await loadOwnedRfq(req.params.id, req.user!.organizationId);
  if (!owned) return res.status(404).json({ error: "RFQ not found" });
  const { requests } = req.body as { requests: { vendorId: string; subject: string; body: string }[] };
  const results = await Promise.all(requests.map((r) => sendQuoteRequest(req.params.id, r.vendorId, r.subject, r.body)));
  res.status(201).json(results);
});

rfqRouter.get("/rfqs/:id/comparison", async (req, res) => {
  const owned = await loadOwnedRfq(req.params.id, req.user!.organizationId);
  if (!owned) return res.status(404).json({ error: "RFQ not found" });
  res.json(await buildComparisonMatrix(req.params.id));
});

// Single RFQ with its quotes (vendor, status, price) — the RFQ detail
// page this feeds doesn't need extracted specs, just enough to link into
// negotiation/comparison per quote.
rfqRouter.get("/rfqs/:id", async (req, res) => {
  const owned = await loadOwnedRfq(req.params.id, req.user!.organizationId);
  if (!owned) return res.status(404).json({ error: "RFQ not found" });
  const rfq = await prisma.rfqEvent.findUnique({
    where: { id: req.params.id },
    include: { quotes: { include: { vendor: true }, orderBy: { createdAt: "asc" } } },
  });
  res.json(rfq);
});

// Adds a quote with pasted-in text and immediately queues extraction —
// the fast path for testing spec-extraction/negotiation without wiring
// real vendor-email ingestion first. draft-requests/send-requests above
// are the "real" outreach flow; this is the shortcut, same pattern as
// quick-request.ts is to the full purchase-request flow.
rfqRouter.post("/rfqs/:id/quotes", validate(addQuoteSchema), async (req, res) => {
  const owned = await loadOwnedRfq(req.params.id, req.user!.organizationId);
  if (!owned) return res.status(404).json({ error: "RFQ not found" });

  const { vendorId, rawEmailText, totalPrice } = req.body;
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.organizationId !== req.user!.organizationId) {
    return res.status(400).json({ error: "vendorId must be a vendor in your organization" });
  }

  const quote = await prisma.quote.create({
    data: {
      rfqEventId: req.params.id,
      vendorId,
      rawEmailText,
      totalPrice: totalPrice || null,
      status: "extracting",
    },
  });
  await ingestVendorReply(quote.id, rawEmailText);
  res.status(201).json(quote);
});

// Quotes and extracted specs don't carry organizationId directly — they're
// scoped implicitly through their RFQ, so ownership is checked by walking
// that relation rather than a direct field.
rfqRouter.post("/quotes/:id/ingest", async (req, res) => {
  const quote = await prisma.quote.findUnique({ where: { id: req.params.id }, include: { rfqEvent: true } });
  if (!quote || quote.rfqEvent.organizationId !== req.user!.organizationId) {
    return res.status(404).json({ error: "Quote not found" });
  }
  const { rawEmailText, rawDocumentUrl } = req.body;
  await ingestVendorReply(req.params.id, rawEmailText, rawDocumentUrl);
  res.status(202).json({ queued: true });
});

rfqRouter.post("/extracted-specs/:id/review", async (req, res) => {
  const spec = await prisma.extractedSpec.findUnique({
    where: { id: req.params.id },
    include: { quote: { include: { rfqEvent: true } } },
  });
  if (!spec || spec.quote.rfqEvent.organizationId !== req.user!.organizationId) {
    return res.status(404).json({ error: "Spec not found" });
  }
  const { correctedValue } = req.body;
  await reviewExtractedField(req.params.id, req.user!.id, correctedValue);
  res.status(204).send();
});
