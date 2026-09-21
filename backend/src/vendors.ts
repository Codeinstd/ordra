import { PrismaClient } from "@prisma/client";
import { classifyVendorFromWebsite } from "./llm";

const prisma = new PrismaClient();

export async function createVendor(
  organizationId: string,
  data: {
    name: string;
    website?: string;
    categories: string[];
    certifications?: string[];
    contactEmail?: string;
  }
) {
  return prisma.vendor.create({
    data: { ...data, organizationId, certifications: data.certifications ?? [] },
  });
}

export async function searchVendors(organizationId: string, params: { category?: string; certification?: string }) {
  return prisma.vendor.findMany({
    where: {
      organizationId,
      categories: params.category ? { has: params.category } : undefined,
      certifications: params.certification ? { has: params.certification } : undefined,
    },
    include: { reliabilityScore: true },
  });
}

// A real fetch of the vendor's own site, crudely stripped of markup —
// this is intentionally not a full HTML parser, just enough to hand
// readable text to the LLM. Bounded to 8k chars so the extraction call
// stays cheap and fast regardless of page size.
async function fetchWebsiteText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ProcurementVendorBot/1.0)" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  const html = await res.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

// Enterprise "finding vendors" is mostly sourcing expansion against an
// existing approved-vendor list, not cold web discovery — this is that
// expansion step: given a vendor already in the directory with a website
// on file, fetch the page and let the LLM suggest categories/
// certifications actually mentioned there, merged into what's already
// recorded (never overwriting an existing value the vendor record already
// has, since a human may have set it deliberately).
export async function enrichVendorFromWebsite(vendorId: string) {
  const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id: vendorId } });
  if (!vendor.website) throw new Error(`Vendor ${vendorId} has no website on file to enrich from`);

  const text = await fetchWebsiteText(vendor.website);
  const result = await classifyVendorFromWebsite(text);

  const mergedCategories = Array.from(new Set([...vendor.categories, ...result.categories]));
  const mergedCertifications = Array.from(new Set([...vendor.certifications, ...result.certifications]));

  return prisma.vendor.update({
    where: { id: vendorId },
    data: {
      categories: mergedCategories,
      certifications: mergedCertifications,
      notes: vendor.notes ? vendor.notes : result.summary,
    },
  });
}
