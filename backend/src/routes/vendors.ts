import { Router } from "express";
import { createVendor, searchVendors } from "../vendors";
import { scoreVendor } from "../reliability";

export const vendorRouter = Router();

vendorRouter.post("/vendors", async (req, res) => {
  res.status(201).json(await createVendor(req.body));
});

vendorRouter.get("/vendors", async (req, res) => {
  res.json(await searchVendors({ category: req.query.category as string, certification: req.query.certification as string }));
});

vendorRouter.post("/vendors/:id/reliability", async (req, res) => {
  res.json(await scoreVendor(req.params.id, req.body));
});
