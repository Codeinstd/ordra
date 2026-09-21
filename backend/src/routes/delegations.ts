import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { validate } from "../middleware/validate";
import { delegationSchema } from "../schemas";

const prisma = new PrismaClient();
export const delegationRouter = Router();

// Everything you've delegated away, and everything delegated to you —
// both directions matter to someone checking "who's covering for me" or
// "whose approvals am I covering."
delegationRouter.get("/delegations", async (req, res) => {
  const [given, received] = await Promise.all([
    prisma.delegation.findMany({ where: { delegatorId: req.user!.id }, orderBy: { startDate: "desc" } }),
    prisma.delegation.findMany({ where: { delegateId: req.user!.id }, orderBy: { startDate: "desc" } }),
  ]);
  const userIds = Array.from(new Set([...given.map((d) => d.delegateId), ...received.map((d) => d.delegatorId)]));
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } });
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));

  res.json({
    given: given.map((d) => ({ ...d, delegate: byId[d.delegateId] })),
    received: received.map((d) => ({ ...d, delegator: byId[d.delegatorId] })),
  });
});

// A delegate must be a teammate in the same organization — resolveDelegate()
// in routing-engine.ts trusts whatever's in this table when it reroutes an
// approval, so this is the one place that has to keep that constraint true.
delegationRouter.post("/delegations", validate(delegationSchema), async (req, res) => {
  const { delegateEmail, startDate, endDate, reason } = req.body;

  const delegate = await prisma.user.findUnique({ where: { email: delegateEmail } });
  if (!delegate || delegate.organizationId !== req.user!.organizationId) {
    return res.status(400).json({ error: "delegateEmail must belong to a teammate in your organization" });
  }
  if (delegate.id === req.user!.id) {
    return res.status(400).json({ error: "You can't delegate to yourself" });
  }

  const delegation = await prisma.delegation.create({
    data: { delegatorId: req.user!.id, delegateId: delegate.id, startDate: new Date(startDate), endDate: new Date(endDate), reason },
  });
  res.status(201).json(delegation);
});

// Hard-delete is safe here, unlike approval steps or policies — a
// delegation only affects chain *resolution* going forward
// (resolveDelegate() is called live at reconciliation time); any
// approval step already created under it already has the resolved
// approverUserId baked in and is unaffected by removing this row.
delegationRouter.delete("/delegations/:id", async (req, res) => {
  const delegation = await prisma.delegation.findUnique({ where: { id: req.params.id } });
  if (!delegation || delegation.delegatorId !== req.user!.id) {
    return res.status(404).json({ error: "Delegation not found" });
  }
  await prisma.delegation.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
