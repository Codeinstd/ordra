import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { validate } from "../middleware/validate";
import { createPolicySchema } from "../schemas";

const prisma = new PrismaClient();
export const policyRouter = Router();

policyRouter.get("/policies", async (req, res) => {
  const policies = await prisma.approvalPolicy.findMany({
    where: { organizationId: req.user!.organizationId },
    orderBy: { priority: "desc" },
  });
  res.json(policies);
});

// Policies are matched by (department, category, amount range), highest
// priority first — see findMatchingPolicy() in routing-engine.ts. A
// narrower policy should outrank the org's wildcard fallback, so the UI
// is responsible for picking a sensible priority; this route just trusts
// what it's given rather than trying to infer "specificity" itself.
policyRouter.post("/policies", validate(createPolicySchema), async (req, res) => {
  const { name, priority, department, category, amountMin, amountMax, chainTemplate } = req.body;
  const policy = await prisma.approvalPolicy.create({
    data: {
      organizationId: req.user!.organizationId,
      name,
      priority,
      department: department ?? null,
      category: category ?? null,
      amountMin,
      amountMax,
      chainTemplate,
    },
  });
  res.status(201).json(policy);
});

// Policies are never deleted outright — an in-flight purchase request may
// have been routed under one, and reconcileRouting() re-resolves against
// "currently active" policies on every change, so retiring one needs to
// leave history intact. Setting activeUntil is the soft-delete.
policyRouter.post("/policies/:id/deactivate", async (req, res) => {
  const policy = await prisma.approvalPolicy.findUnique({ where: { id: req.params.id } });
  if (!policy || policy.organizationId !== req.user!.organizationId) {
    return res.status(404).json({ error: "Policy not found" });
  }
  const updated = await prisma.approvalPolicy.update({ where: { id: req.params.id }, data: { activeUntil: new Date() } });
  res.json(updated);
});
