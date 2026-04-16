import * as BrandService from "./brand.service.js";

export const listBrands = async (req, res) => {
  const brands = await BrandService.listBrands(req.query);
  res.status(200).json({ status: "success", results: brands.length, data: brands });
};

export const getBrand = async (req, res) => {
  const brand = await BrandService.getBrandById(req.params.id);
  res.status(200).json({ status: "success", data: brand });
};

export const createBrand = async (req, res) => {
  const brand = await BrandService.createBrand(req.validated.body);
  res.status(201).json({ status: "success", message: "Brand created", data: brand });
};

export const updateBrand = async (req, res) => {
  const brand = await BrandService.updateBrand(req.params.id, req.validated.body);
  res.status(200).json({ status: "success", message: "Brand updated", data: brand });
};

export const deleteBrand = async (req, res) => {
  await BrandService.deleteBrand(req.params.id);
  res.status(200).json({ status: "success", message: "Brand deleted" });
};
