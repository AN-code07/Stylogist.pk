import { Category } from "./category.model.js";
import { Product } from "../products/product.model.js";

export const getCategoryTree = async () => {
  const categories = await Category.find({ isActive: true }).lean();

  const map = {};
  const roots = [];

  categories.forEach(cat => {
    map[cat._id] = { ...cat, children: [] };
  });

  categories.forEach(cat => {
    if (cat.parent) {
      map[cat.parent]?.children.push(map[cat._id]);
    } else {
      roots.push(map[cat._id]);
    }
  });

  return roots;
};


export const getAllCategories = async (query) => {
  const { parent, active = "true", includeCount } = query;

  const filter = {};

  // Active filter
  if (active === "true") {
    filter.isActive = true;
  }

  // Parent filtering
  if (parent === "null") {
    filter.parent = null;
  } else if (parent) {
    filter.parent = parent;
  }

  let categories = await Category.find(filter)
    .sort({ createdAt: 1 })
    .lean();

  // Optional: include product count
  if (includeCount === "true") {
    const categoryIds = categories.map(c => c._id);

    const counts = await Product.aggregate([
      { $match: { category: { $in: categoryIds }, status: "published" } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const countMap = {};
    counts.forEach(c => {
      countMap[c._id.toString()] = c.count;
    });

    categories = categories.map(cat => ({
      ...cat,
      productCount: countMap[cat._id.toString()] || 0,
    }));
  }

  return categories;
};

export const getDescendantCategoryIds = async (categoryId) => {
  const categories = await Category.find({ isActive: true }).lean();

  const map = {};
  categories.forEach(cat => {
    const parentId = cat.parent?.toString() || null;
    if (!map[parentId]) map[parentId] = [];
    map[parentId].push(cat._id.toString());
  });

  const result = [];
  const stack = [categoryId];

  while (stack.length) {
    const current = stack.pop();
    result.push(current);

    const children = map[current];
    if (children) {
      stack.push(...children);
    }
  }

  return result;
};