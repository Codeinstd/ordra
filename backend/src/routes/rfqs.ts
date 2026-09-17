import { Router } from "express";
import { createRfq, draftQuoteRequests, sendQuoteRequest, ingestVendorReply } from "../rfq";
import { buildComparisonMatrix } from "../price-comparison";
import { reviewExtractedField } from "../spec-extraction";

export const rfqRouter = Router();

rfqRouter.post("/rfqs", async (req, res) => {
  res.status(201).json(await createRfq({ ...req.body, requesterId: req.user!.id }));
});

rfqRouter.post("/rfqs/:id/draft-requests", async (req, res) => {
  const { vendorIds } = req.body as { vendorIds: string[] };
  res.json(await draftQuoteRequests(req.params.id, vendorIds));
});

rfqRouter.post("/rfqs/:id/send-requests", async (req, res) => {
  const { requests } = req.body as { requests: { vendorId: string; subject: string; body: string }[] };
  const results = await Promise.all(requests.map((r) => sendQuoteRequest(req.params.id, r.vendorId, r.subject, r.body)));
  res.status(201).json(results);
});

rfqRouter.get("/rfqs/:id/comparison", async (req, res) => {
  res.json(await buildComparisonMatrix(req.params.id));
});

rfqRouter.post("/quotes/:id/ingest", async (req, res) => {
  const { rawEmailText, rawDocumentUrl } = req.body;
  await ingestVendorReply(req.params.id, rawEmailText, rawDocumentUrl);
  res.status(202).json({ queued: true });
});

rfqRouter.post("/extracted-specs/:id/review", async (req, res) => {
  const { correctedValue } = req.body;
  await reviewExtractedField(req.params.id, req.user!.id, correctedValue);
  res.status(204).send();
});
