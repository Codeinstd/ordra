import { Worker, Queue } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { connection } from "../queue";

const prisma = new PrismaClient();
const SLA_HOURS = 48;
const ESCALATION_HOURS = 96;

// Scheduled repeatedly (see registerEscalationSchedule below) rather than
// triggered per-step, since this is a sweep over everything currently
// pending, not a reaction to a single event.
export const escalationWorker = new Worker(
  "approval-escalation",
  async () => {
    const now = Date.now();
    const pendingSteps = await prisma.approvalStep.findMany({
      where: { status: "pending" },
      include: { purchaseRequest: true, approver: true },
    });

    for (const step of pendingSteps) {
      if (step.routingVersion !== step.purchaseRequest.currentRoutingVersion) continue; // stale, not actionable
      const ageHours = (now - step.createdAt.getTime()) / (1000 * 60 * 60);

      if (ageHours >= ESCALATION_HOURS && step.approver.managerId) {
        console.log(`[stub notify] escalating step ${step.id} to manager ${step.approver.managerId}`);
        await prisma.approvalAuditLog.create({
          data: {
            purchaseRequestId: step.purchaseRequestId,
            eventType: "step_escalated",
            metadata: { stepId: step.id, escalatedTo: step.approver.managerId, ageHours },
          },
        });
      } else if (ageHours >= SLA_HOURS) {
        console.log(`[stub notify] reminder: step ${step.id} pending ${ageHours.toFixed(0)}h for ${step.approverUserId}`);
      }
    }
  },
  { connection }
);

export async function registerEscalationSchedule() {
  const queue = new Queue("approval-escalation", { connection });
  await queue.add("sweep", {}, { repeat: { every: 60 * 60 * 1000 } }); // hourly
}
