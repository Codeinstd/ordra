import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { validate } from "../middleware/validate";
import { inviteSchema } from "../schemas";

const prisma = new PrismaClient();
export const orgRouter = Router();

orgRouter.get("/org/me", async (req, res) => {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: req.user!.organizationId },
    include: { users: { select: { id: true, name: true, email: true, role: true, department: true, isOrgOwner: true } } },
  });
  res.json(org);
});

orgRouter.get("/org/invites", async (req, res) => {
  const invites = await prisma.orgInvite.findMany({
    where: { organizationId: req.user!.organizationId, acceptedAt: null },
    orderBy: { createdAt: "desc" },
  });
  res.json(invites);
});

// Only the org owner can invite — a lightweight stand-in for real
// role-based access control, which this reference implementation doesn't
// otherwise have. Anyone past this point who signs up with the invited
// email joins this organization automatically (see resolveOrgForNewUser
// in routes/auth.ts) rather than getting their own new org.
orgRouter.post("/org/invites", validate(inviteSchema), async (req, res) => {
  const inviter = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  if (!inviter.isOrgOwner) return res.status(403).json({ error: "Only the organization owner can invite teammates" });

  const { email } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return res.status(409).json({ error: "That email already has an account" });

  const invite = await prisma.orgInvite.upsert({
    where: { organizationId_email: { organizationId: req.user!.organizationId, email } },
    update: {}, // re-inviting is a no-op, not an error
    create: { organizationId: req.user!.organizationId, email, invitedById: req.user!.id },
  });
  res.status(201).json(invite);
});
