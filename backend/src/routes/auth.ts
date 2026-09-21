import { Router } from "express";
import rateLimit from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";
import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword, issueToken } from "../auth";
import { createOrganization, findPendingInvite, acceptInvite } from "../org";
import { issueVerificationToken, consumeVerificationToken } from "../verification";
import { sendEmail } from "../mailer";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../schemas";

const prisma = new PrismaClient();
export const authRouter = Router();

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// Login and registration are the two endpoints an attacker can hammer to
// brute-force credentials or spam-create accounts — everything else
// requires a valid token already, which rate-limits itself. Keyed by IP,
// generous enough not to lock out a real user mistyping their password a
// few times, tight enough to make brute-forcing impractical.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts — please wait a few minutes and try again." },
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Resolves which organization a newly-authenticating email belongs to: a
// pending invite wins (join that team), otherwise a brand new
// organization is created and this user becomes its owner.
async function resolveOrgForNewUser(email: string, companyName?: string) {
  const invite = await findPendingInvite(email);
  if (invite) {
    await acceptInvite(invite.id);
    return { organizationId: invite.organizationId, isOrgOwner: false };
  }
  const org = await createOrganization(companyName?.trim() || `${email.split("@")[0]}'s workspace`);
  return { organizationId: org.id, isOrgOwner: true };
}

async function sendVerificationEmail(user: { id: string; email: string; name: string }) {
  const token = await issueVerificationToken(user.id, "email_verification");
  const link = `${FRONTEND_URL}/verify-email?token=${token}`;
  try {
    await sendEmail(user.email, "Verify your email", `Hi ${user.name},\n\nConfirm your email: ${link}\n\nThis link expires in 7 days.`);
  } catch (err) {
    console.error(`Failed to send verification email to ${user.email}:`, err);
  }
}

authRouter.post("/auth/register", authLimiter, validate(registerSchema), async (req, res) => {
  const { name, email, password, companyName, department, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const { organizationId, isOrgOwner } = await resolveOrgForNewUser(email, companyName);

  // A self-serve signup won't know its org's department/role taxonomy yet
  // — default the same way the Google flow does, and leave real
  // provisioning to an onboarding step or admin invite later.
  const user = await prisma.user.create({
    data: {
      name,
      email,
      organizationId,
      isOrgOwner,
      department: department ?? "unassigned",
      role: role ?? "unassigned",
      passwordHash: await hashPassword(password),
    },
  });

  await sendVerificationEmail(user);

  res.status(201).json({
    token: issueToken(user),
    user: { id: user.id, name: user.name, email: user.email, organizationId },
  });
});

authRouter.post("/auth/login", authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid email or password" });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  res.json({
    token: issueToken(user),
    user: { id: user.id, name: user.name, email: user.email, organizationId: user.organizationId },
  });
});

// The frontend gets a Google ID token from Google Sign-In / NextAuth and
// forwards it here. We verify it ourselves rather than trusting the
// frontend's claim about who signed in — the whole point of the check.
authRouter.post("/auth/google", async (req, res) => {
  const { idToken } = req.body;
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: "Invalid Google token" });
  }
  if (!payload?.email) return res.status(401).json({ error: "Google token missing email" });

  let user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user) {
    const { organizationId, isOrgOwner } = await resolveOrgForNewUser(payload.email);
    user = await prisma.user.create({
      data: {
        name: payload.name ?? payload.email,
        email: payload.email,
        organizationId,
        isOrgOwner,
        googleId: payload.sub,
        department: "unassigned",
        role: "unassigned",
        emailVerified: true, // Google already verified this email — no need to re-verify
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({ where: { id: user.id }, data: { googleId: payload.sub, emailVerified: true } });
  }

  res.json({
    token: issueToken(user),
    user: { id: user.id, name: user.name, email: user.email, organizationId: user.organizationId },
  });
});

authRouter.get("/auth/verify-email", async (req, res) => {
  const token = req.query.token as string | undefined;
  if (!token) return res.status(400).json({ error: "Missing token" });

  const userId = await consumeVerificationToken(token, "email_verification");
  if (!userId) return res.status(400).json({ error: "This verification link is invalid or has expired" });

  await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
  res.json({ verified: true });
});

// Deliberately returns 200 regardless of whether the email exists — the
// response itself must not reveal which emails have accounts.
authRouter.post("/auth/forgot-password", authLimiter, validate(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.passwordHash) {
    const token = await issueVerificationToken(user.id, "password_reset");
    const link = `${FRONTEND_URL}/reset-password?token=${token}`;
    try {
      await sendEmail(user.email, "Reset your password", `Hi ${user.name},\n\nReset your password: ${link}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`);
    } catch (err) {
      console.error(`Failed to send password reset email to ${user.email}:`, err);
    }
  }
  res.json({ sent: true });
});

authRouter.post("/auth/reset-password", authLimiter, validate(resetPasswordSchema), async (req, res) => {
  const { token, newPassword } = req.body;

  const userId = await consumeVerificationToken(token, "password_reset");
  if (!userId) return res.status(400).json({ error: "This reset link is invalid or has expired" });

  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } });
  res.json({ reset: true });
});
