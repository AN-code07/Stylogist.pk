import { Category } from "./category.model.js";
import * as CategoryService from "./category.service.js"

export const getCategoryTree = async (req, res) => {
    const tree = await CategoryService.getCategoryTree();

    res.status(200).json({
        success: true,
        data: tree,
    });
};

export const getAllCategories = async (req, res) => {
    const categories = await CategoryService.getAllCategories(req.query);

    res.status(200).json({
        success: true,
        results: categories.length,
        data: categories,
    });
};