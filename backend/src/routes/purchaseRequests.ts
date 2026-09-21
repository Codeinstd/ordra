import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { submitPurchaseRequest, onPurchaseRequestFieldsChanged, approveStep, rejectStep } from "../routing-engine";
import { createAndSubmitRequest } from "../quick-request";
import { validate } from "../middleware/validate";
import { quickRequestSchema } from "../schemas";

const prisma = new PrismaClient();
export const router = Router();

// Every route below that takes a purchase request id first confirms it
// belongs to the caller's organization before doing anything else — the
// id alone is guessable/enumerable, so this is the actual tenancy
// boundary, not just the list queries. 404 rather than 403 so a request
// from another org doesn't even confirm the id exists.
async function loadOwnedPurchaseRequest(id: string, organizationId: string) {
  const pr = await prisma.purchaseRequest.findUnique({ where: { id } });
  if (!pr || pr.organizationId !== organizationId) return null;
  return pr;
}

// One-shot: creates the RFQ/vendor/quote scaffolding a purchase request
// needs and submits it immediately. This is the fast path for testing the
// approval engine without first running the full vendor-outreach and
// spec-extraction flow — see quick-request.ts for why it exists.
router.post("/purchase-requests/quick", validate(quickRequestSchema), async (req, res) => {
  const { vendorName, category, department, amount } = req.body;
  const result = await createAndSubmitRequest({
    requesterId: req.user!.id,
    organizationId: req.user!.organizationId,
    vendorName,
    category,
    department,
    amount,
  });
  res.status(201).json(result);
});

// Create a purchase request in "draft", then submit it separately —
// keeps the "materialize the chain" moment explicit rather than implicit
// in record creation.
router.post("/purchase-requests", async (req, res) => {
  const { rfqId, quoteId, amount, department, category } = req.body;
  const pr = await prisma.purchaseRequest.create({
    data: {
      rfqId,
      quoteId,
      requesterId: req.user!.id,
      organizationId: req.user!.organizationId,
      amount,
      department,
      category,
      status: "draft",
    },
  });
  res.status(201).json(pr);
});

// The requester's own submitted requests — there was previously no way to
// check on something after submitting it.
router.get("/purchase-requests", async (req, res) => {
  const requests = await prisma.purchaseRequest.findMany({
    where: { requesterId: req.user!.id, organizationId: req.user!.organizationId },
    include: { quote: { include: { vendor: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(requests);
});

router.post("/purchase-requests/:id/submit", async (req, res) => {
  const owned = await loadOwnedPurchaseRequest(req.params.id, req.user!.organizationId);
  if (!owned) return res.status(404).json({ error: "Purchase request not found" });
  const result = await submitPurchaseRequest(req.params.id);
  res.json(result);
});

// Any update to routing-relevant fields (e.g. a negotiated price landing)
// goes through here so the re-routing invariant fires uniformly, whether
// it's a manual edit or an automated settlement from the negotiation flow.
router.patch("/purchase-requests/:id", async (req, res) => {
  const owned = await loadOwnedPurchaseRequest(req.params.id, req.user!.organizationId);
  if (!owned) return res.status(404).json({ error: "Purchase request not found" });
  const changedFields = Object.keys(req.body);
  const pr = await prisma.purchaseRequest.update({ where: { id: req.params.id }, data: req.body });
  await onPurchaseRequestFieldsChanged(req.params.id, changedFields);
  res.json(pr);
});

router.get("/purchase-requests/:id", async (req, res) => {
  const owned = await loadOwnedPurchaseRequest(req.params.id, req.user!.organizationId);
  if (!owned) return res.status(404).json({ error: "Purchase request not found" });

  const pr = await prisma.purchaseRequest.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      steps: { orderBy: [{ routingVersion: "desc" }, { stepOrder: "asc" }], include: { approver: true } },
      auditLog: { orderBy: { createdAt: "desc" } },
      quote: { include: { vendor: true } },
    },
  });
  const currentSteps = pr.steps.filter((s) => s.routingVersion === pr.currentRoutingVersion);
  res.json({ ...pr, steps: currentSteps });
});

// Pending approvals for the authenticated caller — the query the frontend
// queue polls. Inherently org-safe: a step's approverUserId can only ever
// be a user resolveRoleToUser() found within their own organization, so
// scoping by approverUserId alone can't leak another org's steps.
router.get("/approval-steps", async (req, res) => {
  const approverId = req.user!.id;
  const steps = await prisma.approvalStep.findMany({
    where: { approverUserId: approverId, status: "pending" },
    include: { purchaseRequest: true },
    orderBy: { createdAt: "asc" },
  });
  // Only steps that belong to their request's *current* routing version are
  // actionable — anything from an older version is history, not a live task.
  res.json(steps.filter((s) => s.routingVersion === s.purchaseRequest.currentRoutingVersion));
});

router.post("/approval-steps/:id/approve", async (req, res) => {
  const { comments } = req.body;
  const result = await approveStep(req.params.id, req.user!.id, comments);
  res.json(result);
});

router.post("/approval-steps/:id/reject", async (req, res) => {
  const { comments } = req.body;
  await rejectStep(req.params.id, req.user!.id, comments);
  res.status(204).send();
});
