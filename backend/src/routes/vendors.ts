import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { createVendor, searchVendors, enrichVendorFromWebsite } from "../vendors";
import { scoreVendor } from "../reliability";
import { discoverVendors } from "../llm";
import { validate } from "../middleware/validate";
import { createVendorSchema, discoverVendorsSchema, reliabilitySignalsSchema } from "../schemas";

const prisma = new PrismaClient();
export const vendorRouter = Router();

async function loadOwnedVendor(id: string, organizationId: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor || vendor.organizationId !== organizationId) return null;
  return vendor;
}

vendorRouter.post("/vendors", validate(createVendorSchema), async (req, res) => {
  res.status(201).json(await createVendor(req.user!.organizationId, req.body));
});

vendorRouter.get("/vendors", async (req, res) => {
  res.json(
    await searchVendors(req.user!.organizationId, {
      category: req.query.category as string,
      certification: req.query.certification as string,
    })
  );
});

// Real web search (see discoverVendors in llm.ts) — candidates are
// returned for review, never saved automatically. Adding one to the
// directory is a separate, explicit POST /vendors call the frontend
// makes once the person picks one.
vendorRouter.post("/vendors/discover", validate(discoverVendorsSchema), async (req, res) => {
  const { query } = req.body;
  try {
    res.json(await discoverVendors(query));
  } catch (err) {
    res.status(502).json({ error: `Vendor search failed: ${(err as Error).message}` });
  }
});

vendorRouter.post("/vendors/:id/reliability", validate(reliabilitySignalsSchema), async (req, res) => {
  if (!(await loadOwnedVendor(req.params.id, req.user!.organizationId))) {
    return res.status(404).json({ error: "Vendor not found" });
  }
  res.json(await scoreVendor(req.params.id, req.body));
});

vendorRouter.post("/vendors/:id/enrich", async (req, res) => {
  if (!(await loadOwnedVendor(req.params.id, req.user!.organizationId))) {
    return res.status(404).json({ error: "Vendor not found" });
  }
  try {
    res.json(await enrichVendorFromWebsite(req.params.id));
  } catch (err) {
    res.status(422).json({ error: (err as Error).message });
  }
});
