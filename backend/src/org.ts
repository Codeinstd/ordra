import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Every new organization needs somewhere for a request to route even
// before anyone has configured a real policy — a single-step chain to
// whoever owns the org. resolveRoleToUser() in routing-engine.ts has a
// special case for the "org_owner" role that finds this user directly,
// rather than a role/department lookup like every other role tag.
async function seedDefaultPolicy(organizationId: string) {
  await prisma.approvalPolicy.create({
    data: {
      organizationId,
      name: "Default single-approver policy",
      priority: 0,
      department: null,
      category: null,
      amountMin: null,
      amountMax: null,
      chainTemplate: [{ order: 1, type: "sequential", role: "org_owner" }],
    },
  });
}

export async function createOrganization(name: string) {
  const org = await prisma.organization.create({ data: { name } });
  await seedDefaultPolicy(org.id);
  return org;
}

// A real team should end up in one shared org rather than each signup
// creating its own isolated one-person org. If someone already invited
// this email, join that organization instead of creating a new one.
export async function findPendingInvite(email: string) {
  return prisma.orgInvite.findFirst({ where: { email, acceptedAt: null } });
}

export async function acceptInvite(inviteId: string) {
  await prisma.orgInvite.update({ where: { id: inviteId }, data: { acceptedAt: new Date() } });
}
