import { chainConditionMet } from "../pure/chain-conditions";

describe("chainConditionMet", () => {
  it("returns true when there is no condition", () => {
    expect(chainConditionMet(undefined, 500)).toBe(true);
  });

  it("evaluates a strict greater-than condition", () => {
    expect(chainConditionMet("amount > 100000", 150000)).toBe(true);
    expect(chainConditionMet("amount > 100000", 100000)).toBe(false);
    expect(chainConditionMet("amount > 100000", 50000)).toBe(false);
  });

  it("evaluates greater-than-or-equal", () => {
    expect(chainConditionMet("amount >= 100000", 100000)).toBe(true);
    expect(chainConditionMet("amount >= 100000", 99999)).toBe(false);
  });

  it("evaluates less-than and less-than-or-equal", () => {
    expect(chainConditionMet("amount < 1000", 999)).toBe(true);
    expect(chainConditionMet("amount < 1000", 1000)).toBe(false);
    expect(chainConditionMet("amount <= 1000", 1000)).toBe(true);
  });

  it("defaults to true for an unrecognized condition string", () => {
    expect(chainConditionMet("category = equipment", 100)).toBe(true);
  });
});
