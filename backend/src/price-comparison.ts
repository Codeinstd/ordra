import { PrismaClient } from "@prisma/client";
import { calculateTCO } from "./pure/tco";

const prisma = new PrismaClient();

export { calculateTCO };

export type MatrixRow = {
  fieldKey: string;
  values: Record<string /* vendorId */, { value: string; unit?: string; confidence: number }>;
};

export type ComparisonMatrix = {
  vendors: { id: string; name: string; totalPrice: number | null }[];
  rows: MatrixRow[];
};

// Builds the side-by-side view a procurement officer actually reads.
// Only quotes that have cleared extraction ("ready") are included — a
// quote still sitting in "needs_review" would silently corrupt the
// comparison with unverified numbers.
export async function buildComparisonMatrix(rfqId: string): Promise<ComparisonMatrix> {
  const quotes = await prisma.quote.findMany({
    where: { rfqEventId: rfqId, status: "ready" },
    include: { vendor: true, extractedSpecs: true },
  });

  const fieldKeys = new Set<string>();
  for (const q of quotes) for (const s of q.extractedSpecs) fieldKeys.add(s.fieldKey);

  const rows: MatrixRow[] = Array.from(fieldKeys).map((fieldKey) => {
    const values: MatrixRow["values"] = {};
    for (const q of quotes) {
      const spec = q.extractedSpecs.find((s) => s.fieldKey === fieldKey);
      if (spec) values[q.vendorId] = { value: spec.value, unit: spec.unit ?? undefined, confidence: spec.confidence };
    }
    return { fieldKey, values };
  });

  return {
    vendors: quotes.map((q) => ({ id: q.vendorId, name: q.vendor.name, totalPrice: q.totalPrice ? Number(q.totalPrice) : null })),
    rows,
  };
}
