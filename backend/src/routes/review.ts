import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const reviewRouter = Router();

const CONFIDENCE_THRESHOLD = 0.75;

// Everything in a "needs_review" quote that hasn't been reviewed yet,
// scoped to the caller's org via the quote -> rfqEvent relation (specs
// don't carry organizationId directly). Confidence < threshold is the
// same bar spec-extraction.ts uses to flag a field in the first place.
reviewRouter.get("/review-queue", async (req, res) => {
  const specs = await prisma.extractedSpec.findMany({
    where: {
      reviewedAt: null,
      confidence: { lt: CONFIDENCE_THRESHOLD },
      quote: { rfqEvent: { organizationId: req.user!.organizationId } },
    },
    include: { quote: { include: { vendor: true, rfqEvent: true } } },
    orderBy: { createdAt: "asc" },
  });
  res.json(specs);
});
