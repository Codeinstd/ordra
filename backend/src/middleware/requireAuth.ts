import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../auth";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string; name: string };
    }
  }
}

// Every write in this system (approving a step, sending a negotiation
// message, editing a purchase request) should attribute to the caller
// who actually authenticated, never to a client-supplied id in the body.
// Routes that used to read `actorId`/`approverId` from req.body should
// read req.user!.id instead once this middleware runs.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }
  try {
    const payload = verifyToken(header.slice("Bearer ".length));
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
