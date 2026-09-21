import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TOKEN_TTL_MS = {
  password_reset: 60 * 60 * 1000, // 1 hour
  email_verification: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

type Purpose = keyof typeof TOKEN_TTL_MS;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Returns the plaintext token — this is the only moment it exists outside
// the user's inbox; only its hash is ever persisted, so a database leak
// alone can't be used to forge a valid reset or verification link.
export async function issueVerificationToken(userId: string, purpose: Purpose): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      userId,
      purpose,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS[purpose]),
    },
  });
  return token;
}

// Consumes the token on success (usedAt set) so it can't be replayed.
// Returns the userId it belonged to, or null if it's missing/expired/used
// — callers should treat that as "invalid or expired link", not leak
// which specific reason.
export async function consumeVerificationToken(token: string, purpose: Purpose): Promise<string | null> {
  const tokenHash = hashToken(token);
  const record = await prisma.verificationToken.findFirst({
    where: { tokenHash, purpose, usedAt: null, expiresAt: { gte: new Date() } },
  });
  if (!record) return null;
  await prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.userId;
}
