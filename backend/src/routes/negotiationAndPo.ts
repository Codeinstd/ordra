import { Router } from "express";
import { startNegotiation, generateDraft, approveAndSendDraft, recordVendorResponse } from "../negotiation";
import { exportPurchaseOrderToErp, generatePurchaseOrderDocument } from "../po";

export const negotiationRouter = Router();

negotiationRouter.post("/negotiations", async (req, res) => {
  const { quoteId, targetSavingsPct } = req.body;
  res.status(201).json(await startNegotiation(quoteId, targetSavingsPct));
});

negotiationRouter.post("/negotiations/:id/draft", async (req, res) => {
  const { vendorQuoteSummary, comparableQuotesSummary } = req.body;
  res.json(await generateDraft(req.params.id, vendorQuoteSummary, comparableQuotesSummary));
});

// The only send path — requires the authenticated caller, never a
// client-supplied id, so a negotiation email can't be marked "approved
// and sent" by anyone other than whoever is actually holding the session.
negotiationRouter.post("/negotiation-messages/:id/approve-and-send", async (req, res) => {
  res.json(await approveAndSendDraft(req.params.id, req.user!.id));
});

negotiationRouter.post("/negotiations/:id/vendor-response", async (req, res) => {
  const { body } = req.body;
  res.status(201).json(await recordVendorResponse(req.params.id, body));
});

export const poRouter = Router();

poRouter.get("/purchase-requests/:id/po", async (req, res) => {
  res.json(await generatePurchaseOrderDocument(req.params.id));
});

poRouter.post("/purchase-requests/:id/export", async (req, res) => {
  res.json(await exportPurchaseOrderToErp(req.params.id));
});
