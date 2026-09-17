import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/auth";
const prisma = new PrismaClient();

async function main() {
  const demoPassword = await hashPassword("demo-password-123");

  const cfo = await prisma.user.create({
    data: { name: "Dana CFO", email: "dana@example.com", passwordHash: demoPassword, role: "cfo", department: "finance" },
  });
  const legal = await prisma.user.create({
    data: { name: "Lee Legal", email: "lee@example.com", passwordHash: demoPassword, role: "legal_reviewer", department: "legal" },
  });
  const finance = await prisma.user.create({
    data: { name: "Fran Finance", email: "fran@example.com", passwordHash: demoPassword, role: "finance_reviewer", department: "finance" },
  });
  const deptHead = await prisma.user.create({
    data: { name: "Devi Head", email: "devi@example.com", passwordHash: demoPassword, role: "department_head", department: "engineering" },
  });
  const manager = await prisma.user.create({
    data: { name: "Mo Manager", email: "mo@example.com", passwordHash: demoPassword, role: "direct_manager", department: "engineering" },
  });
  await prisma.user.create({
    data: {
      name: "Rae Requester",
      email: "rae@example.com",
      passwordHash: demoPassword,
      role: "engineer",
      department: "engineering",
      managerId: manager.id,
    },
  });

  await prisma.approvalPolicy.create({
    data: {
      name: "Engineering equipment over $10k",
      priority: 10,
      department: "engineering",
      category: "equipment",
      amountMin: 10000,
      amountMax: null,
      chainTemplate: [
        { order: 1, type: "sequential", role: "direct_manager" },
        { order: 2, type: "parallel_group", groupId: "legal_finance", roles: ["legal_reviewer", "finance_reviewer"] },
        { order: 3, type: "sequential", role: "department_head" },
        { order: 4, type: "sequential", role: "cfo", condition: "amount > 100000" },
      ],
    },
  });

  await prisma.specSchema.createMany({
    data: [
      { category: "equipment", fieldKey: "unit_price", fieldType: "number", unit: "USD", required: true },
      { category: "equipment", fieldKey: "lead_time", fieldType: "number", unit: "days", required: true },
      { category: "equipment", fieldKey: "warranty_years", fieldType: "number", unit: "years", required: false },
    ],
  });

  const vendor = await prisma.vendor.create({
    data: { name: "Acme Industrial", categories: ["equipment"], certifications: ["ISO9001"], contactEmail: "sales@acme.example" },
  });

  console.log("Seeded.", { vendorId: vendor.id });
}

main().finally(() => prisma.$disconnect());
