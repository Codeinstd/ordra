import { PrismaClient } from "@prisma/client";
import { explainReliabilityScore } from "./llm";

const prisma = new PrismaClient();

export type ReliabilitySignals = {
  onTimeDeliveryRate?: number; // 0-1, from past PO history if available
  financialHealthScore?: number; // 0-100, e.g. from a D&B-style API
  certificationCount: number;
  yearsInBusiness?: number;
  pastDefectRate?: number; // 0-1
};

// Weighted blend, not a black box: every weight here is a product/policy
// decision your procurement customers should be able to see and, ideally,
// tune per category (a defense contractor cares about certs more than a
// stationery vendor does).
export function computeReliabilityScore(signals: ReliabilitySignals): number {
  let score = 50; // neutral baseline for unknown vendors
  if (signals.onTimeDeliveryRate !== undefined) score += (signals.onTimeDeliveryRate - 0.5) * 40;
  if (signals.financialHealthScore !== undefined) score += (signals.financialHealthScore - 50) * 0.3;
  score += Math.min(signals.certificationCount, 5) * 3;
  if (signals.yearsInBusiness !== undefined) score += Math.min(signals.yearsInBusiness, 20) * 0.5;
  if (signals.pastDefectRate !== undefined) score -= signals.pastDefectRate * 30;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function scoreVendor(vendorId: string, signals: ReliabilitySignals) {
  const score = computeReliabilityScore(signals);
  const rationale = await explainReliabilityScore(signals, score);

  return prisma.reliabilityScore.upsert({
    where: { vendorId },
    create: { vendorId, score, rationale, signals: signals as object },
    update: { score, rationale, signals: signals as object, computedAt: new Date() },
  });
}
