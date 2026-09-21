import { computeReliabilityScore } from "../pure/reliability-score";

describe("computeReliabilityScore", () => {
  it("returns the neutral baseline for a vendor with no signals at all", () => {
    expect(computeReliabilityScore({ certificationCount: 0 })).toBe(50);
  });

  it("stays within 0-100 bounds even with extreme inputs", () => {
    const high = computeReliabilityScore({
      onTimeDeliveryRate: 1,
      financialHealthScore: 100,
      certificationCount: 20,
      yearsInBusiness: 100,
      pastDefectRate: 0,
    });
    expect(high).toBeLessThanOrEqual(100);

    const low = computeReliabilityScore({
      onTimeDeliveryRate: 0,
      financialHealthScore: 0,
      certificationCount: 0,
      yearsInBusiness: 0,
      pastDefectRate: 1,
    });
    expect(low).toBeGreaterThanOrEqual(0);
  });

  it("rewards a strong on-time delivery rate and penalizes a poor one, relative to baseline", () => {
    const strong = computeReliabilityScore({ onTimeDeliveryRate: 0.98, certificationCount: 0 });
    const weak = computeReliabilityScore({ onTimeDeliveryRate: 0.5, certificationCount: 0 });
    const poor = computeReliabilityScore({ onTimeDeliveryRate: 0.1, certificationCount: 0 });
    expect(strong).toBeGreaterThan(weak);
    expect(weak).toBeGreaterThan(poor);
  });

  it("caps the certification bonus at 5 certifications", () => {
    const fiveCerts = computeReliabilityScore({ certificationCount: 5 });
    const tenCerts = computeReliabilityScore({ certificationCount: 10 });
    expect(fiveCerts).toBe(tenCerts);
  });

  it("penalizes a higher past defect rate", () => {
    const cleanRecord = computeReliabilityScore({ certificationCount: 0, pastDefectRate: 0 });
    const defectiveRecord = computeReliabilityScore({ certificationCount: 0, pastDefectRate: 0.2 });
    expect(cleanRecord).toBeGreaterThan(defectiveRecord);
  });
});
