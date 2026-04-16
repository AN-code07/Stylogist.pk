import * as ProductService from "./product.service.js";

export const createProduct = async (req, res) => {
  const result = await ProductService.createProduct(req.validated.body);
  res.status(201).json({ status: "success", message: "Product created", data: result });
};

export const getAllProducts = async (req, res) => {
  const { items, pagination } = await ProductService.getAllProducts(req.query);
  res.status(200).json({ status: "success", results: items.length, pagination, data: items });
};

export const getProductBySlug = async (req, res) => {
  const result = await ProductService.getProductBySlug(req.params.slug);
  res.status(200).json({ status: "success", data: result });
};

export const getProductById = async (req, res) => {
  const result = await ProductService.getProductById(req.params.id);
  res.status(200).json({ status: "success", data: result });
};

export const deleteProduct = async (req, res) => {
  await ProductService.deleteProduct(req.params.id);
  res.status(200).json({ status: "success", message: "Product deleted" });
};

export const getFilterMetadata = async (_req, res) => {
  const meta = await ProductService.getFilterMetadata();
  res.status(200).json({ status: "success", data: meta });
};
