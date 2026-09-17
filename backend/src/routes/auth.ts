import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword, issueToken } from "../auth";

const prisma = new PrismaClient();
export const authRouter = Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

authRouter.post("/auth/register", async (req, res) => {
  const { name, email, password, department, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "name, email, and password are required" });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  // A self-serve signup (the marketing site's "Start for free") won't know
  // its org's department/role taxonomy yet — default the same way the
  // Google flow does, and leave real provisioning to an onboarding step
  // or admin invite later.
  const user = await prisma.user.create({
    data: {
      name,
      email,
      department: department ?? "unassigned",
      role: role ?? "unassigned",
      passwordHash: await hashPassword(password),
    },
  });
  res.status(201).json({ token: issueToken(user), user: { id: user.id, name: user.name, email: user.email } });
});

authRouter.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid email or password" });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  res.json({ token: issueToken(user), user: { id: user.id, name: user.name, email: user.email } });
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
    // First-time Google sign-in creates an account. department/role default
    // to "unassigned" — a real deployment would route this through an
    // onboarding step or provision from an HRIS instead.
    user = await prisma.user.create({
      data: {
        name: payload.name ?? payload.email,
        email: payload.email,
        googleId: payload.sub,
        department: "unassigned",
        role: "unassigned",
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({ where: { id: user.id }, data: { googleId: payload.sub } });
  }

  res.json({ token: issueToken(user), user: { id: user.id, name: user.name, email: user.email } });
});
