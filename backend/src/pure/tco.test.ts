import { calculateTCO } from "../pure/tco";

describe("calculateTCO", () => {
  it("computes base price times quantity with no extras", () => {
    expect(calculateTCO({ unitPrice: 100, quantity: 3 })).toBe(300);
  });

  it("adds shipping on top of the base price", () => {
    expect(calculateTCO({ unitPrice: 100, quantity: 3, shipping: 50 })).toBe(350);
  });

  it("adds warranty cost across the warranty period", () => {
    expect(calculateTCO({ unitPrice: 1000, quantity: 1, warrantyCostPerYear: 100, warrantyYears: 3 })).toBe(1300);
  });

  it("applies a payment-terms discount as a percentage of the base price only", () => {
    // base = 1000, 10% discount = 100 off; shipping is untouched by the discount
    expect(
      calculateTCO({ unitPrice: 1000, quantity: 1, shipping: 50, paymentTermsDiscountPct: 10 })
    ).toBe(1000 + 50 - 100);
  });

  it("combines shipping, warranty, and discount together", () => {
    const result = calculateTCO({
      unitPrice: 500,
      quantity: 2, // base 1000
      shipping: 25,
      warrantyCostPerYear: 50,
      warrantyYears: 2, // +100
      paymentTermsDiscountPct: 5, // -50 (5% of base 1000)
    });
    expect(result).toBe(1000 + 25 + 100 - 50);
  });
});
