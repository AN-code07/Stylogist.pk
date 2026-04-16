import { Category } from "./category.model.js";
import { Product } from "../products/product.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateUniqueSlug } from "../../utils/slug.js";

export const getCategoryTree = async () => {
  const categories = await Category.find({ isActive: true }).sort({ level: 1, name: 1 }).lean();

  const map = {};
  const roots = [];

  categories.forEach((cat) => {
    map[cat._id] = { ...cat, children: [] };
  });

  categories.forEach((cat) => {
    const node = map[cat._id];
    if (cat.parent && map[cat.parent]) {
      map[cat.parent].children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

export const getAllCategories = async (query = {}) => {
  const { parent, active = "true", includeCount, search } = query;

  const filter = {};
  if (active === "true") filter.isActive = true;
  if (active === "false") filter.isActive = false;

  if (parent === "null") filter.parent = null;
  else if (parent) filter.parent = parent;

  if (search) filter.name = { $regex: search, $options: "i" };

  let categories = await Category.find(filter).sort({ level: 1, createdAt: 1 }).lean();

  if (includeCount === "true" && categories.length) {
    const ids = categories.map((c) => c._id);
    const counts = await Product.aggregate([
      { $match: { category: { $in: ids }, status: "published" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
    categories = categories.map((c) => ({
      ...c,
      productCount: map[c._id.toString()] || 0,
    }));
  }

  return categories;
};

// Traverses the tree downward and returns [category, ...all descendant IDs].
// Used by product filters so that querying "Women's Fashion" also matches
// products filed under "Dresses", "Tops", etc.
export const getDescendantCategoryIds = async (categoryId) => {
  const categories = await Category.find({ isActive: true }, { _id: 1, parent: 1 }).lean();

  const childrenByParent = new Map();
  categories.forEach((cat) => {
    const key = cat.parent?.toString() || null;
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key).push(cat._id.toString());
  });

  const result = [];
  const stack = [categoryId.toString()];

  while (stack.length) {
    const current = stack.pop();
    result.push(current);
    const children = childrenByParent.get(current);
    if (children) stack.push(...children);
  }

  return result;
};

export const getCategoryById = async (id) => {
  const category = await Category.findById(id).lean();
  if (!category) throw new ApiError(404, "Category not found");
  return category;
};

export const createCategory = async (data) => {
  const payload = { ...data };

  // Compute depth from the parent so we don't have to store it redundantly on the client.
  if (payload.parent) {
    const parent = await Category.findById(payload.parent);
    if (!parent) throw new ApiError(404, "Parent category not found");
    payload.level = parent.level + 1;
  } else {
    payload.parent = null;
    payload.level = 0;
  }

  payload.slug = await generateUniqueSlug(Category, payload.name);
  return Category.create(payload);
};

export const updateCategory = async (id, data) => {
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, "Category not found");

  // Guard against creating cycles (setting a node's parent to itself or one of its descendants).
  if (data.parent && data.parent.toString() === id.toString()) {
    throw new ApiError(400, "A category cannot be its own parent");
  }
  if (data.parent) {
    const descendantIds = await getDescendantCategoryIds(id);
    if (descendantIds.includes(data.parent.toString())) {
      throw new ApiError(400, "Cannot move a category under one of its own descendants");
    }
    const parent = await Category.findById(data.parent);
    if (!parent) throw new ApiError(404, "Parent category not found");
    category.parent = parent._id;
    category.level = parent.level + 1;
  } else if (data.parent === null) {
    category.parent = null;
    category.level = 0;
  }

  if (data.name && data.name !== category.name) {
    category.slug = await generateUniqueSlug(Category, data.name, id);
    category.name = data.name;
  }

  if (data.description !== undefined) category.description = data.description;
  if (data.image !== undefined) category.image = data.image || null;
  if (data.isActive !== undefined) category.isActive = data.isActive;

  await category.save();
  return category.toObject();
};

export const deleteCategory = async (id) => {
  const hasChildren = await Category.exists({ parent: id });
  if (hasChildren) {
    throw new ApiError(409, "Cannot delete category: it has sub-categories. Remove or move them first.");
  }
  const hasProducts = await Product.exists({ category: id });
  if (hasProducts) {
    throw new ApiError(409, "Cannot delete category: products are assigned to it. Reassign or remove them first.");
  }

  const deleted = await Category.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Category not found");
  return deleted.toObject();
};
