// Extracted into its own zero-dependency module for unit testing —
// price-comparison.ts instantiates a PrismaClient at module load, which
// this pure calculation shouldn't need to care about.
//
// Total cost of ownership, not just sticker price — folds in the fields
// most quotes actually vary on beyond the headline number.
export function calculateTCO(params: {
  unitPrice: number;
  quantity: number;
  shipping?: number;
  warrantyCostPerYear?: number;
  warrantyYears?: number;
  paymentTermsDiscountPct?: number;
}): number {
  const base = params.unitPrice * params.quantity;
  const shipping = params.shipping ?? 0;
  const warranty = (params.warrantyCostPerYear ?? 0) * (params.warrantyYears ?? 0);
  const discount = params.paymentTermsDiscountPct ? base * (params.paymentTermsDiscountPct / 100) : 0;
  return base + shipping + warranty - discount;
}
