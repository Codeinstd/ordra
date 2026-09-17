import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { submitPurchaseRequest, onPurchaseRequestFieldsChanged, approveStep, rejectStep } from "../routing-engine";

const prisma = new PrismaClient();
export const router = Router();

// Create a purchase request in "draft", then submit it separately —
// keeps the "materialize the chain" moment explicit rather than implicit
// in record creation.
router.post("/purchase-requests", async (req, res) => {
  const { rfqId, quoteId, amount, department, category } = req.body;
  const pr = await prisma.purchaseRequest.create({
    data: { rfqId, quoteId, requesterId: req.user!.id, amount, department, category, status: "draft" },
  });
  res.status(201).json(pr);
});

router.post("/purchase-requests/:id/submit", async (req, res) => {
  const result = await submitPurchaseRequest(req.params.id);
  res.json(result);
});

router.post("/purchase-requests/quick", async (req, res) => {
  try {
    const { amount, department, category } = req.body;

    if (amount == null || !department || !category) {
      return res.status(400).json({
        error: "amount, department, and category are required",
      });
    }

    const pr = await prisma.purchaseRequest.create({
      data: {
        amount,
        department,
        category,
        requesterId: req.user!.id,
        status: "draft",
      },
    });

    res.status(201).json(pr);
  } catch (error) {
    console.error("[purchase-request] quick create failed:", error);

    res.status(500).json({
      error: "Failed to create purchase request",
    });
  }
});

// Any update to routing-relevant fields (e.g. a negotiated price landing)
// goes through here so the re-routing invariant fires uniformly, whether
// it's a manual edit or an automated settlement from the negotiation flow.
router.patch("/purchase-requests/:id", async (req, res) => {
  const changedFields = Object.keys(req.body);
  const pr = await prisma.purchaseRequest.update({ where: { id: req.params.id }, data: req.body });
  await onPurchaseRequestFieldsChanged(req.params.id, changedFields);
  res.json(pr);
});

router.get("/purchase-requests", async (req, res) => {
  try {
    const requests = await prisma.purchaseRequest.findMany({
      where: {
        requesterId: req.user!.id,
      },
      include: {
        steps: {
          orderBy: {
            stepOrder: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(requests);
  } catch (error) {
    console.error("[purchase-requests] list failed:", error);

    res.status(500).json({
      error: "Failed to load purchase requests",
    });
  }
});

router.get("/purchase-requests/:id", async (req, res) => {
  const pr = await prisma.purchaseRequest.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      steps: { orderBy: [{ routingVersion: "desc" }, { stepOrder: "asc" }] },
      auditLog: { orderBy: { createdAt: "desc" } },
    },
  });
  const currentSteps = pr.steps.filter((s) => s.routingVersion === pr.currentRoutingVersion);
  res.json({ ...pr, steps: currentSteps });
});

// Pending approvals for the authenticated caller — the query the frontend
// queue polls. No longer accepts an arbitrary approverId query param;
// you can only ever see your own queue.
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
