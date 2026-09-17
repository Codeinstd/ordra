import express from "express";
import cors from "cors";
import { router } from "./routes/purchaseRequests";
import { vendorRouter } from "./routes/vendors";
import { rfqRouter } from "./routes/rfqs";
import { negotiationRouter, poRouter } from "./routes/negotiationAndPo";
import { authRouter } from "./routes/auth";
import { requireAuth } from "./middleware/requireAuth";

const app = express();

// The frontend runs on a different origin (localhost:3000 vs this API's
// :4000), so without CORS the browser blocks every request before it
// reaches Express — that's what shows up client-side as "Failed to fetch".
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

// Public — issues the tokens everything else requires.
app.use("/api", authRouter);

// Everything below requires a valid bearer token; routes read the caller's
// identity from req.user, never from a client-supplied id in the body.
app.use("/api", requireAuth, router);
app.use("/api", requireAuth, vendorRouter);
app.use("/api", requireAuth, rfqRouter);
app.use("/api", requireAuth, negotiationRouter);
app.use("/api", requireAuth, poRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => console.log(`Approval engine API listening on :${port}`));
