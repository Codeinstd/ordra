import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const auditRouter = Router();

// ApprovalAuditLog doesn't carry organizationId directly — scoped through
// its purchaseRequest, same pattern as the other implicitly-scoped
// records. Capped at 200 most-recent events; this is a browsing view, not
// an export mechanism.
auditRouter.get("/audit-log", async (req, res) => {
  const events = await prisma.approvalAuditLog.findMany({
    where: { purchaseRequest: { organizationId: req.user!.organizationId } },
    include: { purchaseRequest: { include: { quote: { include: { vendor: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(events);
});
