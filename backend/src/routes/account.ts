import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { issueVerificationToken } from "../verification";
import { sendEmail } from "../mailer";

const prisma = new PrismaClient();
export const accountRouter = Router();

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

accountRouter.get("/account/me", async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, emailVerified: true, isOrgOwner: true },
  });
  res.json(user);
});

accountRouter.post("/account/resend-verification", async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  if (user.emailVerified) return res.json({ alreadyVerified: true });

  const token = await issueVerificationToken(user.id, "email_verification");
  const link = `${FRONTEND_URL}/verify-email?token=${token}`;
  await sendEmail(user.email, "Verify your email", `Hi ${user.name},\n\nConfirm your email: ${link}\n\nThis link expires in 7 days.`);
  res.json({ sent: true });
});
