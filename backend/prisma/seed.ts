import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/auth";
import { createOrganization } from "../src/org";

const prisma = new PrismaClient();

async function main() {
  const demoPassword = await hashPassword("demo-password-123");

  // createOrganization() also seeds the wildcard "org_owner" fallback
  // policy every organization gets automatically — see src/org.ts.
  const org = await createOrganization("Acme Demo Co");

  // Ann Admin is this org's owner — the wildcard fallback policy routes to
  // whoever holds isOrgOwner in the request's organization, so this user
  // is where anything lands that doesn't match a more specific policy.
  await prisma.user.create({
    data: {
      name: "Ann Admin",
      email: "admin@example.com",
      passwordHash: demoPassword,
      role: "admin",
      department: "operations",
      organizationId: org.id,
      isOrgOwner: true,
    },
  });

  const cfo = await prisma.user.create({
    data: { name: "Dana CFO", email: "dana@example.com", passwordHash: demoPassword, role: "cfo", department: "finance", organizationId: org.id },
  });
  const legal = await prisma.user.create({
    data: { name: "Lee Legal", email: "lee@example.com", passwordHash: demoPassword, role: "legal_reviewer", department: "legal", organizationId: org.id },
  });
  const finance = await prisma.user.create({
    data: { name: "Fran Finance", email: "fran@example.com", passwordHash: demoPassword, role: "finance_reviewer", department: "finance", organizationId: org.id },
  });
  const deptHead = await prisma.user.create({
    data: { name: "Devi Head", email: "devi@example.com", passwordHash: demoPassword, role: "department_head", department: "engineering", organizationId: org.id },
  });
  const manager = await prisma.user.create({
    data: { name: "Mo Manager", email: "mo@example.com", passwordHash: demoPassword, role: "direct_manager", department: "engineering", organizationId: org.id },
  });
  await prisma.user.create({
    data: {
      name: "Rae Requester",
      email: "rae@example.com",
      passwordHash: demoPassword,
      role: "engineer",
      department: "engineering",
      organizationId: org.id,
      managerId: manager.id,
    },
  });

  await prisma.approvalPolicy.create({
    data: {
      organizationId: org.id,
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

  // Shared taxonomy, not per-tenant — every org uses the same field
  // definitions for a given category in this reference implementation.
  await prisma.specSchema.createMany({
    data: [
      { category: "equipment", fieldKey: "unit_price", fieldType: "number", unit: "USD", required: true },
      { category: "equipment", fieldKey: "lead_time", fieldType: "number", unit: "days", required: true },
      { category: "equipment", fieldKey: "warranty_years", fieldType: "number", unit: "years", required: false },
    ],
    skipDuplicates: true,
  });

  const vendor = await prisma.vendor.create({
    data: {
      organizationId: org.id,
      name: "Acme Industrial",
      categories: ["equipment"],
      certifications: ["ISO9001"],
      contactEmail: "sales@acme.example",
    },
  });

  console.log("Seeded.", { organizationId: org.id, vendorId: vendor.id });
}

main().finally(() => prisma.$disconnect());
