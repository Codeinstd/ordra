import { Worker, Queue } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { connection } from "../queue";
import { sendEmail } from "../mailer";

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
      include: { purchaseRequest: { include: { quote: { include: { vendor: true } } } }, approver: true },
    });

    for (const step of pendingSteps) {
      if (step.routingVersion !== step.purchaseRequest.currentRoutingVersion) continue; // stale, not actionable
      const ageHours = (now - step.createdAt.getTime()) / (1000 * 60 * 60);
      const context = `${step.purchaseRequest.quote.vendor.name} — ${step.purchaseRequest.category}, ${step.purchaseRequest.department}`;

      if (ageHours >= ESCALATION_HOURS && step.approver.managerId) {
        const manager = await prisma.user.findUnique({ where: { id: step.approver.managerId } });
        if (manager) {
          await sendEmail(
            manager.email,
            `Escalated: an approval has waited ${Math.round(ageHours)}h`,
            `${step.approver.name}'s pending approval for "${context}" has waited over ${ESCALATION_HOURS}h and has been escalated to you.`
          );
        }
        await prisma.approvalAuditLog.create({
          data: {
            purchaseRequestId: step.purchaseRequestId,
            eventType: "step_escalated",
            metadata: { stepId: step.id, escalatedTo: step.approver.managerId, ageHours },
          },
        });
      } else if (ageHours >= SLA_HOURS) {
        await sendEmail(
          step.approver.email,
          "Reminder: a purchase request is waiting on your approval",
          `"${context}" has been waiting ${Math.round(ageHours)}h for your review.`
        );
      }
    }
  },
  { connection }
);

export async function registerEscalationSchedule() {
  const queue = new Queue("approval-escalation", { connection });
  await queue.add("sweep", {}, { repeat: { every: 60 * 60 * 1000 } }); // hourly
}
