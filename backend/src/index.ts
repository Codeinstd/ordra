import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { router } from "./routes/purchaseRequests";
import { vendorRouter } from "./routes/vendors";
import { rfqRouter } from "./routes/rfqs";
import { negotiationRouter, poRouter } from "./routes/negotiationAndPo";
import { authRouter } from "./routes/auth";
import { orgRouter } from "./routes/org";
import { policyRouter } from "./routes/policies";
import { reviewRouter } from "./routes/review";
import { accountRouter } from "./routes/account";
import { delegationRouter } from "./routes/delegations";
import { auditRouter } from "./routes/audit";
import { requireAuth } from "./middleware/requireAuth";

const app = express();

// The frontend runs on a different origin (localhost:3000 vs this API's
// :4000), so without CORS the browser blocks every request before it
// reaches Express — that's what shows up client-side as "Failed to fetch".
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

// A light general ceiling on every request, independent of the stricter
// per-endpoint limiter on /auth/login and /auth/register in routes/auth.ts.
app.use(
  "/api",
  rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false })
);

// Public — issues the tokens everything else requires.
app.use("/api", authRouter);

// Everything below requires a valid bearer token; routes read the caller's
// identity (and organizationId) from req.user, never from a client-supplied
// value in the body.
app.use("/api", requireAuth, router);
app.use("/api", requireAuth, vendorRouter);
app.use("/api", requireAuth, rfqRouter);
app.use("/api", requireAuth, negotiationRouter);
app.use("/api", requireAuth, poRouter);
app.use("/api", requireAuth, orgRouter);
app.use("/api", requireAuth, policyRouter);
app.use("/api", requireAuth, reviewRouter);
app.use("/api", requireAuth, accountRouter);
app.use("/api", requireAuth, delegationRouter);
app.use("/api", requireAuth, auditRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => console.log(`Approval engine API listening on :${port}`));
