import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET must be set");

// organizationId travels in the token itself so every route can scope its
// queries without an extra DB round-trip just to find out who the caller's
// org is. It's set once at issue time and never trusted from anywhere else
// (never from a request body).
export type AuthTokenPayload = { sub: string; email: string; name: string; organizationId: string };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}


export function issueToken(user: { id: string; email: string; name: string; organizationId: string }): string {
  const payload: AuthTokenPayload = { sub: user.id, email: user.email, name: user.name, organizationId: user.organizationId };
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET!) as AuthTokenPayload;
}
