// Minimal expression support for a chain step's optional condition, e.g.
// "amount > 100000". Extracted into its own zero-dependency module so it
// can be unit tested without pulling in Prisma (routing-engine.ts
// instantiates a PrismaClient at module load, which a pure-logic test
// shouldn't need to care about).
export function chainConditionMet(condition: string | undefined, amount: number): boolean {
  if (!condition) return true;
  const match = condition.match(/amount\s*([<>]=?)\s*(\d+)/);
  if (!match) return true;
  const [, op, valueStr] = match;
  const value = Number(valueStr);
  switch (op) {
    case ">": return amount > value;
    case ">=": return amount >= value;
    case "<": return amount < value;
    case "<=": return amount <= value;
    default: return true;
  }
}
