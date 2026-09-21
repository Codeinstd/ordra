// Extracted into its own zero-dependency module for unit testing —
// reliability.ts instantiates a PrismaClient at module load, which a
// pure scoring-math test shouldn't need to care about.
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
