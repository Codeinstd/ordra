import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createVendor(data: {
  name: string;
  website?: string;
  categories: string[];
  certifications?: string[];
  contactEmail?: string;
}) {
  return prisma.vendor.create({
    data: { ...data, certifications: data.certifications ?? [] },
  });
}

export async function searchVendors(params: { category?: string; certification?: string }) {
  return prisma.vendor.findMany({
    where: {
      categories: params.category ? { has: params.category } : undefined,
      certifications: params.certification ? { has: params.certification } : undefined,
    },
    include: { reliabilityScore: true },
  });
}

// Enterprise "finding vendors" is mostly sourcing expansion against an
// existing approved-vendor list, not cold web discovery — this stub is
// the seam where a real enrichment job (web search + LLM extraction of
// vendor site content into categories/certifications) would plug in.
// Kept separate from createVendor so it can run as its own BullMQ job
// without blocking the request that triggered it.
export async function enrichVendorFromWebsite(vendorId: string, websiteText: string) {
  // TODO: replace with a real extractStructured() call against the
  // vendor's site content once a fetch/crawl step feeds this in.
  const guessedCategories = websiteText.toLowerCase().includes("manufactur") ? ["manufacturing"] : [];
  return prisma.vendor.update({
    where: { id: vendorId },
    data: { categories: { push: guessedCategories } },
  });
}
