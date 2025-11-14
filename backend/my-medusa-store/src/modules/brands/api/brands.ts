import { Router } from "express";
import { Brand } from "../models/brand";
import { getRepository } from "typeorm";

const router = Router();

// GET /store/brands
router.get("/store/brands", async (req, res) => {
  const brandRepo = getRepository(Brand);
  const brands = await brandRepo.find();
  res.json(brands);
});

// GET /store/brands/:id
router.get("/store/brands/:id", async (req, res) => {
  const { id } = req.params;
  const brandRepo = getRepository(Brand);
  const brand = await brandRepo.findOne(id);
  if (!brand) {
    return res.status(404).json({ message: "Brand not found" });
  }
  res.json(brand);
});

// POST /admin/brands
router.post("/admin/brands", async (req, res) => {
  const { name, description, logo_url } = req.body;
  const brandRepo = getRepository(Brand);
  const newBrand = brandRepo.create({ name, description, logo_url });
  const savedBrand = await brandRepo.save(newBrand);
  res.status(201).json(savedBrand);
});

// PUT /admin/brands/:id
router.put("/admin/brands/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, logo_url } = req.body;
  const brandRepo = getRepository(Brand);
  const brand = await brandRepo.findOne(id);
  if (!brand) {
    return res.status(404).json({ message: "Brand not found" });
  }
  brand.name = name || brand.name;
  brand.description = description || brand.description;
  brand.logo_url = logo_url || brand.logo_url;
  const updatedBrand = await brandRepo.save(brand);
  res.json(updatedBrand);
});

// DELETE /admin/brands/:id
router.delete("/admin/brands/:id", async (req, res) => {
  const { id } = req.params;
  const brandRepo = getRepository(Brand);
  const brand = await brandRepo.findOne(id);
  if (!brand) {
    return res.status(404).json({ message: "Brand not found" });
  }
  await brandRepo.remove(brand);
  res.status(204).send();
});

export default router;