import { PrismaClient, PurchaseRequest, ApprovalPolicy, ApprovalStep } from "@prisma/client";
import { chainConditionMet } from "./pure/chain-conditions";

const prisma = new PrismaClient();

// ---- Types -----------------------------------------------------------

type ChainSlotTemplate =
  | { order: number; type?: "sequential"; role: string; condition?: string }
  | { order: number; type: "parallel_group"; groupId: string; roles: string[]; condition?: string };

type ResolvedSlot = {
  order: number;
  stepType: "sequential" | "parallel_group";
  groupId: string | null;
  approverRole: string;
  approverUserId: string;
};

// Fields that, if changed, should ever trigger re-routing. Kept generic:
// a policy's own condition keys decide what matters, so adding a new
// policy dimension (e.g. vendorId) automatically extends the invariant
// without touching this list.
const ROUTING_RELEVANT_FIELDS = ["amount", "department", "category"] as const;

// ---- Policy matching ---------------------------------------------------

async function findMatchingPolicy(pr: PurchaseRequest): Promise<ApprovalPolicy> {
  const now = new Date();
  const candidates = await prisma.approvalPolicy.findMany({
    where: {
      organizationId: pr.organizationId,
      OR: [{ department: pr.department }, { department: null }],
      activeFrom: { lte: now },
      AND: [{ OR: [{ activeUntil: null }, { activeUntil: { gte: now } }] }],
    },
    orderBy: { priority: "desc" },
  });

  const amount = Number(pr.amount);
  const match = candidates.find((p) => {
    const categoryOk = p.category === null || p.category === pr.category;
    const minOk = p.amountMin === null || amount >= Number(p.amountMin);
    const maxOk = p.amountMax === null || amount <= Number(p.amountMax);
    return categoryOk && minOk && maxOk;
  });

  if (!match) {
    throw new Error(`No approval policy matches purchase request ${pr.id}`);
  }
  return match;
}

// Resolves an abstract role ("direct_manager", "cfo", ...) to a concrete
// user for this specific request. Real implementation would hit an org
// chart / HRIS lookup; kept simple and swappable here. Every lookup is
// scoped to pr.organizationId — resolving to a same-named role in a
// different organization would be a tenancy breach, not just a bug.
async function resolveRoleToUser(role: string, pr: PurchaseRequest): Promise<string> {
  if (role === "direct_manager") {
    const requester = await prisma.user.findUniqueOrThrow({ where: { id: pr.requesterId } });
    if (!requester.managerId) throw new Error(`Requester ${pr.requesterId} has no manager on file`);
    return requester.managerId;
  }
  if (role === "org_owner") {
    const owner = await prisma.user.findFirst({ where: { organizationId: pr.organizationId, isOrgOwner: true } });
    if (!owner) throw new Error(`Organization ${pr.organizationId} has no owner on file`);
    return owner.id;
  }
  const roleHolder = await prisma.user.findFirst({
    where: { role, department: pr.department, organizationId: pr.organizationId },
  });
  const fallback = roleHolder ?? (await prisma.user.findFirst({ where: { role, organizationId: pr.organizationId } }));
  if (!fallback) throw new Error(`No user found for role "${role}" in this organization`);
  return fallback.id;
}

async function resolveDelegate(userId: string): Promise<string> {
  const now = new Date();
  const active = await prisma.delegation.findFirst({
    where: { delegatorId: userId, startDate: { lte: now }, endDate: { gte: now } },
  });
  return active ? active.delegateId : userId;
}

// Re-exported for convenience/back-compat — the actual logic lives in
// pure/chain-conditions.ts so it can be unit tested without Prisma.
export { chainConditionMet };

async function resolveCandidateChain(pr: PurchaseRequest, policy: ApprovalPolicy): Promise<ResolvedSlot[]> {
  const template = policy.chainTemplate as unknown as ChainSlotTemplate[];
  const slots: ResolvedSlot[] = [];
  const prAmount = Number(pr.amount);

  for (const raw of template) {
    if (!chainConditionMet(raw.condition, prAmount)) continue;

    if (raw.type === "parallel_group") {
      for (const role of raw.roles) {
        let approverUserId = await resolveRoleToUser(role, pr);
        approverUserId = await resolveDelegate(approverUserId);
        slots.push({ order: raw.order, stepType: "parallel_group", groupId: raw.groupId, approverRole: role, approverUserId });
      }
    } else {
      let approverUserId = await resolveRoleToUser(raw.role, pr);
      approverUserId = await resolveDelegate(approverUserId);
      slots.push({ order: raw.order, stepType: "sequential", groupId: null, approverRole: raw.role, approverUserId });
    }
  }

  // Segregation-of-duties: a resolved approver can never be the requester.
  // Reroute that single slot to the approver's own manager rather than
  // silently dropping or auto-approving it.
  for (const slot of slots) {
    if (slot.approverUserId === pr.requesterId) {
      const escalated = await prisma.user.findUniqueOrThrow({ where: { id: slot.approverUserId } });
      if (escalated.managerId) slot.approverUserId = escalated.managerId;
    }
  }

  return slots.sort((a, b) => a.order - b.order);
}

// ---- Reconciliation: the shared core used for both re-routing on field
// change AND the final-authorization gate. There is exactly one place
// that decides "does this chain shape satisfy this request" — everything
// else calls into it. ---------------------------------------------------

export type ReconcileResult = {
  fullySatisfied: boolean;
  newStepsCreated: ResolvedSlot[];
  routingVersion: number;
};

export async function reconcileRouting(purchaseRequestId: string, actorId?: string): Promise<ReconcileResult> {
  return prisma.$transaction(async (tx) => {
    // Lock the row for the duration of reconciliation so a concurrent field
    // update (e.g. a negotiation settling the price) can't race the
    // finalization check that reads it.
    await tx.$executeRawUnsafe(`SELECT id FROM "PurchaseRequest" WHERE id = $1 FOR UPDATE`, purchaseRequestId);

    const pr = await tx.purchaseRequest.findUniqueOrThrow({ where: { id: purchaseRequestId } });
    const policy = await findMatchingPolicy(pr);
    const candidateChain = await resolveCandidateChain(pr, policy);

    const newVersion = pr.currentRoutingVersion + 1;
    const priorSteps = await tx.approvalStep.findMany({
      where: { purchaseRequestId, status: { in: ["approved", "pending"] } },
    });

    const newStepsCreated: ResolvedSlot[] = [];
    const carriedForwardIds: string[] = [];

    for (const slot of candidateChain) {
      // A prior step "still counts" only if it targets the exact same
      // role + approver — position drift (e.g. it moved earlier because a
      // step ahead of it got dropped) still counts as the same requirement,
      // but a different required approver never carries forward silently.
      const match = priorSteps.find(
        (s) => s.approverRole === slot.approverRole && s.approverUserId === slot.approverUserId && s.status === "approved"
      );

      if (match) {
        await tx.approvalStep.create({
          data: {
            purchaseRequestId,
            routingVersion: newVersion,
            stepOrder: slot.order,
            stepType: slot.stepType,
            groupId: slot.groupId,
            approverRole: slot.approverRole,
            approverUserId: slot.approverUserId,
            status: "approved",
            actedById: match.actedById,
            actedAt: match.actedAt,
            comments: match.comments,
          },
        });
        carriedForwardIds.push(match.id);
      } else {
        await tx.approvalStep.create({
          data: {
            purchaseRequestId,
            routingVersion: newVersion,
            stepOrder: slot.order,
            stepType: slot.stepType,
            groupId: slot.groupId,
            approverRole: slot.approverRole,
            approverUserId: slot.approverUserId,
            status: "pending",
          },
        });
        newStepsCreated.push(slot);
      }
    }

    // Anything from the previous version that is still pending and did not
    // survive into the candidate chain is no longer required — mark it
    // superseded, never delete it, so the audit trail shows why it stopped
    // mattering.
    const stillPendingIdsInCandidate = new Set(
      candidateChain
        .filter((slot) => !priorSteps.some((s) => s.approverRole === slot.approverRole && s.approverUserId === slot.approverUserId && s.status === "approved"))
        .map((slot) => `${slot.approverRole}:${slot.approverUserId}`)
    );
    for (const s of priorSteps) {
      if (s.status !== "pending") continue;
      const key = `${s.approverRole}:${s.approverUserId}`;
      if (!stillPendingIdsInCandidate.has(key)) {
        await tx.approvalStep.update({ where: { id: s.id }, data: { status: "superseded" } });
      }
    }

    const fullySatisfied = candidateChain.every((slot) =>
      priorSteps.some((s) => s.approverRole === slot.approverRole && s.approverUserId === slot.approverUserId && s.status === "approved")
    );

    await tx.purchaseRequest.update({
      where: { id: purchaseRequestId },
      data: { currentRoutingVersion: newVersion, status: fullySatisfied ? "approved" : "in_review" },
    });

    await tx.approvalAuditLog.create({
      data: {
        purchaseRequestId,
        eventType: fullySatisfied ? "approved" : newStepsCreated.length > 0 ? "rerouted" : "routed",
        actorId: actorId ?? null,
        metadata: {
          routingVersion: newVersion,
          policyId: policy.id,
          newlyRequiredRoles: newStepsCreated.map((s) => s.approverRole),
          carriedForwardCount: carriedForwardIds.length,
        },
      },
    });

    return { fullySatisfied, newStepsCreated, routingVersion: newVersion };
  });
}

// Call this whenever a routing-relevant field changes on a purchase
// request. Generic on purpose — see ROUTING_RELEVANT_FIELDS above.
export async function onPurchaseRequestFieldsChanged(purchaseRequestId: string, changedFields: string[]) {
  const touchesRouting = changedFields.some((f) => (ROUTING_RELEVANT_FIELDS as readonly string[]).includes(f));
  if (!touchesRouting) return;
  await reconcileRouting(purchaseRequestId);
}

// The Phase 2 gate. Call this after any step is approved — it re-resolves
// the chain one final time before committing to "approved", so a stale
// approval can never be mistaken for final authorization even if the
// request changed a split second earlier.
export async function tryFinalize(purchaseRequestId: string, actorId: string) {
  const result = await reconcileRouting(purchaseRequestId, actorId);

  if (!result.fullySatisfied && result.newStepsCreated.length > 0) {
    await prisma.approvalAuditLog.create({
      data: {
        purchaseRequestId,
        eventType: "finalization_blocked_reroute",
        actorId,
        metadata: {
          routingVersion: result.routingVersion,
          blockedBecauseNewRolesRequired: result.newStepsCreated.map((s) => s.approverRole),
        },
      },
    });
  }

  return result;
}

export async function approveStep(stepId: string, actorId: string, comments?: string) {
  const step = await prisma.approvalStep.findUniqueOrThrow({ where: { id: stepId } });
  if (step.status !== "pending") throw new Error(`Step ${stepId} is not pending (status: ${step.status})`);
  if (step.approverUserId !== actorId) {
    const delegatedFor = await resolveDelegate(step.approverUserId);
    if (delegatedFor !== actorId) throw new Error(`${actorId} is not authorized to act on step ${stepId}`);
  }

  await prisma.approvalStep.update({
    where: { id: stepId },
    data: { status: "approved", actedById: actorId, actedAt: new Date(), comments },
  });
  await prisma.approvalAuditLog.create({
    data: { purchaseRequestId: step.purchaseRequestId, eventType: "step_approved", actorId, metadata: { stepId } },
  });

  // Only worth attempting finalization once every step in this version's
  // parallel group (if any) and everything before it is resolved — but
  // reconcileRouting's own "fullySatisfied" check already handles that
  // correctly, so it's safe to just always attempt it here.
  return tryFinalize(step.purchaseRequestId, actorId);
}

export async function rejectStep(stepId: string, actorId: string, comments?: string) {
  const step = await prisma.approvalStep.findUniqueOrThrow({ where: { id: stepId } });
  if (step.status !== "pending") throw new Error(`Step ${stepId} is not pending (status: ${step.status})`);

  await prisma.approvalStep.update({
    where: { id: stepId },
    data: { status: "rejected", actedById: actorId, actedAt: new Date(), comments },
  });
  await prisma.purchaseRequest.update({ where: { id: step.purchaseRequestId }, data: { status: "rejected" } });
  await prisma.approvalAuditLog.create({
    data: { purchaseRequestId: step.purchaseRequestId, eventType: "step_rejected", actorId, metadata: { stepId, comments } },
  });
}

export async function submitPurchaseRequest(purchaseRequestId: string) {
  await prisma.purchaseRequest.update({ where: { id: purchaseRequestId }, data: { status: "routing" } });
  return reconcileRouting(purchaseRequestId);
}
