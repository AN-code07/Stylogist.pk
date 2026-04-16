import { Brand } from "./brand.model.js";
import { Product } from "../products/product.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateUniqueSlug } from "../../utils/slug.js";

export const listBrands = async (query = {}) => {
  const { active, featured, search, includeCount } = query;

  const filter = {};
  if (active === "true") filter.isActive = true;
  if (active === "false") filter.isActive = false;
  if (featured === "true") filter.isFeatured = true;
  if (search) filter.name = { $regex: search, $options: "i" };

  let brands = await Brand.find(filter).sort({ name: 1 }).lean();

  if (includeCount === "true" && brands.length) {
    const ids = brands.map((b) => b._id);
    const counts = await Product.aggregate([
      { $match: { brand: { $in: ids } } },
      { $group: { _id: "$brand", count: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
    brands = brands.map((b) => ({ ...b, productCount: map[b._id.toString()] || 0 }));
  }

  return brands;
};

export const getBrandById = async (id) => {
  const brand = await Brand.findById(id).lean();
  if (!brand) throw new ApiError(404, "Brand not found");
  return brand;
};

export const createBrand = async (data) => {
  const existing = await Brand.findOne({ name: data.name });
  if (existing) throw new ApiError(409, "A brand with this name already exists");

  const slug = await generateUniqueSlug(Brand, data.name);
  return Brand.create({ ...data, slug });
};

export const updateBrand = async (id, data) => {
  const brand = await Brand.findById(id);
  if (!brand) throw new ApiError(404, "Brand not found");

  // If name changed, regenerate slug (unique; exclude self).
  if (data.name && data.name !== brand.name) {
    const dupe = await Brand.findOne({ name: data.name, _id: { $ne: id } });
    if (dupe) throw new ApiError(409, "A brand with this name already exists");
    brand.slug = await generateUniqueSlug(Brand, data.name, id);
  }

  Object.assign(brand, data);
  await brand.save();
  return brand.toObject();
};

export const deleteBrand = async (id) => {
  const inUse = await Product.exists({ brand: id });
  if (inUse) {
    throw new ApiError(
      409,
      "Cannot delete brand: there are products linked to it. Reassign or remove those products first."
    );
  }
  const deleted = await Brand.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Brand not found");
  return deleted.toObject();
};
