import * as CategoryService from "./category.service.js";

export const getCategoryTree = async (_req, res) => {
  const tree = await CategoryService.getCategoryTree();
  res.status(200).json({ status: "success", data: tree });
};

export const getAllCategories = async (req, res) => {
  const categories = await CategoryService.getAllCategories(req.query);
  res.status(200).json({ status: "success", results: categories.length, data: categories });
};

export const getCategory = async (req, res) => {
  const category = await CategoryService.getCategoryById(req.params.id);
  res.status(200).json({ status: "success", data: category });
};

export const createCategory = async (req, res) => {
  const category = await CategoryService.createCategory(req.validated.body);
  res.status(201).json({ status: "success", message: "Category created", data: category });
};

export const updateCategory = async (req, res) => {
  const category = await CategoryService.updateCategory(req.params.id, req.validated.body);
  res.status(200).json({ status: "success", message: "Category updated", data: category });
};

export const deleteCategory = async (req, res) => {
  await CategoryService.deleteCategory(req.params.id);
  res.status(200).json({ status: "success", message: "Category deleted" });
};
