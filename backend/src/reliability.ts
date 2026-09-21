import { PrismaClient } from "@prisma/client";
import { explainReliabilityScore } from "./llm";
import { computeReliabilityScore, ReliabilitySignals } from "./pure/reliability-score";

const prisma = new PrismaClient();

export { computeReliabilityScore, ReliabilitySignals };

export async function scoreVendor(vendorId: string, signals: ReliabilitySignals) {
  const score = computeReliabilityScore(signals);
  const rationale = await explainReliabilityScore(signals, score);

  return prisma.reliabilityScore.upsert({
    where: { vendorId },
    create: { vendorId, score, rationale, signals: signals as object },
    update: { score, rationale, signals: signals as object, computedAt: new Date() },
  });
}
