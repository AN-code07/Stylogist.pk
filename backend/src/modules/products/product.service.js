import { Product } from "./product.model.js";
import { Variant } from "./variant.model.js";
import { ProductMedia } from "./media.model.js";
import { Category } from "../categories/category.model.js";
import { Brand } from "../brands/brand.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { isValidObjectId } from "mongoose";
import { getDescendantCategoryIds } from "../categories/category.service.js";
import { generateUniqueSlug } from "../../utils/slug.js";
import { generateVariantSku } from "../../utils/sku.js";

// Derive aggregate pricing/stock fields from the variant list in one pass.
const aggregateFromVariants = (variants) => {
  if (!variants?.length) {
    return { minPrice: 0, maxPrice: 0, totalStock: 0, discountPercentage: 0 };
  }
  const prices = variants.map((v) => v.salePrice);
  const stocks = variants.map((v) => v.stock || 0);
  const discounts = variants.map((v) => v.discountPercentage || 0);
  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    totalStock: stocks.reduce((a, b) => a + b, 0),
    discountPercentage: Math.max(...discounts),
  };
};

export const createProduct = async (payload) => {
  const { variants, media = [], category, brand, subCategory, name, slug, ...rest } = payload;

  if (!isValidObjectId(category)) throw new ApiError(400, "Invalid category id");
  const categoryDoc = await Category.findById(category);
  if (!categoryDoc) throw new ApiError(404, "Category not found");

  let brandDoc = null;
  if (brand) {
    if (!isValidObjectId(brand)) throw new ApiError(400, "Invalid brand id");
    brandDoc = await Brand.findById(brand);
    if (!brandDoc) throw new ApiError(404, "Brand not found");
  }

  if (subCategory) {
    if (!isValidObjectId(subCategory)) throw new ApiError(400, "Invalid sub-category id");
    const subCatDoc = await Category.findById(subCategory);
    if (!subCatDoc) throw new ApiError(404, "Sub-category not found");
  }

  const productSlug = slug
    ? await generateUniqueSlug(Product, slug)
    : await generateUniqueSlug(Product, name);

  const aggregates = aggregateFromVariants(variants);

  const product = await Product.create({
    ...rest,
    name,
    slug: productSlug,
    category,
    subCategory: subCategory || undefined,
    brand: brand || undefined,
    ...aggregates,
  });

  // Fill in missing SKUs from the product context so admins don't have to
  // hand-roll codes. The unique index on Variant.sku will still catch true dupes.
  const variantDocs = variants.map((v) => {
    const sku =
      v.sku?.trim() ||
      generateVariantSku({
        brandName: brandDoc?.name,
        categoryName: categoryDoc.name,
        productSlug,
        attrs: [v.color, v.size].filter(Boolean),
      });
    return { ...v, sku, product: product._id };
  });

  try {
    await Variant.insertMany(variantDocs, { ordered: true });
  } catch (err) {
    // Roll back the product if variants fail — otherwise we'd leave an orphan.
    await Product.findByIdAndDelete(product._id);
    if (err?.code === 11000) {
      throw new ApiError(409, "Duplicate variant SKU. Please provide unique SKUs or let the system generate them.");
    }
    throw err;
  }

  if (media.length) {
    const mediaDocs = media.map((m, idx) => ({
      ...m,
      position: m.position ?? idx,
      product: product._id,
    }));
    await ProductMedia.insertMany(mediaDocs);
  }

  return getProductById(product._id);
};

export const getAllProducts = async (query = {}) => {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    rating,
    discount,
    inStock,
    deal,
    sort,
    page = 1,
    limit = 12,
    search,
    status,
  } = query;

  const filter = {};
  // `status=all` (typically from the admin UI) means "don't filter by status".
  // Anything else unrecognized falls through to the safe default so the
  // storefront can't accidentally leak drafts.
  if (status === "draft" || status === "published") {
    filter.status = status;
  } else if (status !== "all") {
    filter.status = "published";
  }

  if (category) {
    const categoryIds = await getDescendantCategoryIds(category);
    filter.category = { $in: categoryIds };
  }
  if (brand) filter.brand = brand;

  if (minPrice || maxPrice) {
    filter.minPrice = {};
    if (minPrice) filter.minPrice.$gte = Number(minPrice);
    if (maxPrice) filter.minPrice.$lte = Number(maxPrice);
  }

  if (rating) filter.averageRating = { $gte: Number(rating) };
  if (discount) filter.discountPercentage = { $gte: Number(discount) };
  if (inStock === "true") filter.totalStock = { $gt: 0 };
  if (deal === "true") filter.isDealActive = true;

  let mongoQuery = Product.find(filter);
  if (search) mongoQuery = mongoQuery.find({ $text: { $search: search } });

  const sortMap = {
    priceLow: { minPrice: 1 },
    priceHigh: { minPrice: -1 },
    newest: { createdAt: -1 },
    rating: { averageRating: -1 },
    bestSelling: { totalSales: -1 },
  };
  mongoQuery = mongoQuery.sort(sort && sortMap[sort] ? sortMap[sort] : { createdAt: -1 });

  const pageNum = Math.max(Number(page), 1);
  const pageSize = Math.min(Math.max(Number(limit), 1), 100);

  const [items, total] = await Promise.all([
    mongoQuery
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .populate("category", "name slug")
      .populate("brand", "name slug logo")
      .lean(),
    Product.countDocuments(filter),
  ]);

  // Product media lives in a separate collection. Attach the first image per
  // product so list views (category page, admin table) don't have to fan out
  // an extra request per card.
  if (items.length) {
    const ids = items.map((p) => p._id);
    const mediaRows = await ProductMedia.aggregate([
      { $match: { product: { $in: ids }, type: "image" } },
      { $sort: { position: 1, createdAt: 1 } },
      { $group: { _id: "$product", url: { $first: "$url" } } },
    ]);
    const byProduct = new Map(mediaRows.map((m) => [m._id.toString(), m.url]));
    items.forEach((p) => {
      p.image = byProduct.get(p._id.toString()) || null;
    });
  }

  return {
    items,
    pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) },
  };
};

export const getProductById = async (id) => {
  const product = await Product.findById(id)
    .populate("category", "name slug")
    .populate("brand", "name slug logo")
    .lean();
  if (!product) throw new ApiError(404, "Product not found");
  const [variants, media] = await Promise.all([
    Variant.find({ product: product._id }).lean(),
    ProductMedia.find({ product: product._id }).sort({ position: 1 }).lean(),
  ]);
  return { product, variants, media };
};

export const getProductBySlug = async (slug) => {
  const product = await Product.findOne({ slug })
    .populate("category", "name slug")
    .populate("brand", "name slug logo")
    .lean();
  if (!product) throw new ApiError(404, "Product not found");
  const [variants, media] = await Promise.all([
    Variant.find({ product: product._id }).lean(),
    ProductMedia.find({ product: product._id }).sort({ position: 1 }).lean(),
  ]);
  return { product, variants, media };
};

export const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, "Product not found");

  await Promise.all([
    Variant.deleteMany({ product: id }),
    ProductMedia.deleteMany({ product: id }),
    Product.findByIdAndDelete(id),
  ]);
  return { id };
};

export const getFilterMetadata = async () => {
  const [brands, priceAgg] = await Promise.all([
    Product.distinct("brand", { status: "published" }),
    Product.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: null, min: { $min: "$minPrice" }, max: { $max: "$maxPrice" } } },
    ]),
  ]);

  return {
    brands,
    priceRange: priceAgg[0] || { min: 0, max: 0 },
  };
};
