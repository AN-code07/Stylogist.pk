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

const buildMediaDocs = ({ thumbnail, media = [], productId, productSlug, metaTitle, metaDescription }) => {
  const docs = [];
  if (thumbnail?.url) {
    docs.push({
      product: productId,
      url: thumbnail.url,
      filename: thumbnail.filename || "",
      slug: thumbnail.slug || `${productSlug}-thumbnail`,
      metaTitle: thumbnail.metaTitle || metaTitle || "",
      metaDescription: thumbnail.metaDescription || metaDescription || "",
      alt: thumbnail.alt || metaTitle || "",
      isThumbnail: true,
      type: thumbnail.type || "image",
      position: 0,
    });
  }
  media.forEach((m, idx) => {
    docs.push({
      product: productId,
      url: m.url,
      filename: m.filename || "",
      slug: m.slug || `${productSlug}-image-${idx + 1}`,
      metaTitle: m.metaTitle || metaTitle || "",
      metaDescription: m.metaDescription || metaDescription || "",
      alt: m.alt || metaTitle || "",
      isThumbnail: false,
      type: m.type || "image",
      position: m.position ?? idx + 1,
    });
  });
  return docs;
};

export const createProduct = async (payload) => {
  const { variants, media = [], thumbnail, category, categories, brand, subCategory, name, slug, metaTitle = "", metaDescription = "", ...rest } = payload;

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

  // Normalize the multi-select list: always include the primary category and
  // deduplicate so MongoDB stores a clean array.
  const categoriesList = Array.isArray(categories) && categories.length
    ? [...new Set([category, ...categories])]
    : [category];

  const product = await Product.create({
    ...rest,
    name,
    slug: productSlug,
    metaTitle,
    metaDescription,
    category,
    categories: categoriesList,
    subCategory: subCategory || undefined,
    brand: brand || undefined,
    ...aggregates,
  });

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
    await Product.findByIdAndDelete(product._id);
    if (err?.code === 11000) {
      throw new ApiError(409, "Duplicate variant SKU. Please provide unique SKUs or let the system generate them.");
    }
    throw err;
  }

  const mediaDocs = buildMediaDocs({
    thumbnail,
    media,
    productId: product._id,
    productSlug,
    metaTitle,
    metaDescription,
  });
  if (mediaDocs.length) await ProductMedia.insertMany(mediaDocs);

  return getProductById(product._id);
};

export const updateProduct = async (id, payload) => {
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid product id");

  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, "Product not found");

  const {
    variants,
    media,
    thumbnail,
    category,
    categories,
    brand,
    subCategory,
    name,
    slug,
    metaTitle,
    metaDescription,
    ...rest
  } = payload;

  if (category) {
    if (!isValidObjectId(category)) throw new ApiError(400, "Invalid category id");
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) throw new ApiError(404, "Category not found");
    product.category = category;
  }

  if (Array.isArray(categories)) {
    const primary = category || product.category;
    product.categories = [...new Set([primary?.toString(), ...categories])].filter(Boolean);
  }

  if (brand !== undefined) {
    if (brand === null || brand === "") {
      product.brand = undefined;
    } else {
      if (!isValidObjectId(brand)) throw new ApiError(400, "Invalid brand id");
      const brandDoc = await Brand.findById(brand);
      if (!brandDoc) throw new ApiError(404, "Brand not found");
      product.brand = brand;
    }
  }

  if (subCategory !== undefined) {
    if (subCategory === null || subCategory === "") {
      product.subCategory = undefined;
    } else {
      if (!isValidObjectId(subCategory)) throw new ApiError(400, "Invalid sub-category id");
      const subCatDoc = await Category.findById(subCategory);
      if (!subCatDoc) throw new ApiError(404, "Sub-category not found");
      product.subCategory = subCategory;
    }
  }

  if (name !== undefined) product.name = name;

  // Slug remains the same on update unless explicitly changed to a different
  // value. Empty string / same value = keep existing slug untouched.
  if (slug && slug.trim() && slug.trim() !== product.slug) {
    product.slug = await generateUniqueSlug(Product, slug.trim(), id);
  }

  if (metaTitle !== undefined) product.metaTitle = metaTitle;
  if (metaDescription !== undefined) product.metaDescription = metaDescription;

  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined) product[key] = value;
  });

  if (Array.isArray(variants) && variants.length) {
    const aggregates = aggregateFromVariants(variants);
    product.minPrice = aggregates.minPrice;
    product.maxPrice = aggregates.maxPrice;
    product.totalStock = aggregates.totalStock;
    product.discountPercentage = aggregates.discountPercentage;
  }

  await product.save();

  if (Array.isArray(variants) && variants.length) {
    const categoryDoc = await Category.findById(product.category);
    const brandDoc = product.brand ? await Brand.findById(product.brand) : null;
    await Variant.deleteMany({ product: product._id });
    const variantDocs = variants.map((v) => {
      const sku =
        v.sku?.trim() ||
        generateVariantSku({
          brandName: brandDoc?.name,
          categoryName: categoryDoc?.name,
          productSlug: product.slug,
          attrs: [v.color, v.size].filter(Boolean),
        });
      return { ...v, sku, product: product._id };
    });
    try {
      await Variant.insertMany(variantDocs, { ordered: true });
    } catch (err) {
      if (err?.code === 11000) {
        throw new ApiError(409, "Duplicate variant SKU. Please provide unique SKUs or let the system generate them.");
      }
      throw err;
    }
  }

  // Media arrays are authoritative when provided: the client sends the final
  // desired set, we replace. Undefined => leave media untouched.
  if (Array.isArray(media) || thumbnail !== undefined) {
    await ProductMedia.deleteMany({ product: product._id });
    const mediaDocs = buildMediaDocs({
      thumbnail: thumbnail || null,
      media: Array.isArray(media) ? media : [],
      productId: product._id,
      productSlug: product.slug,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
    });
    if (mediaDocs.length) await ProductMedia.insertMany(mediaDocs);
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
    featured,
    trending,
    sort,
    page = 1,
    limit = 12,
    search,
    status,
  } = query;

  const filter = {};
  if (status === "draft" || status === "published") {
    filter.status = status;
  } else if (status !== "all") {
    filter.status = "published";
  }

  if (category) {
    const categoryIds = await getDescendantCategoryIds(category);
    // Match either the legacy `category` pointer or the multi-select list so
    // products that live in several categories surface under every one of them.
    filter.$or = [
      { category: { $in: categoryIds } },
      { categories: { $in: categoryIds } },
    ];
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
  // Admin-curated rails. `deal` accepts either the newer `isDeal` flag or
  // the legacy `isDealActive` schedule flag so existing data keeps working.
  if (deal === "true") {
    filter.$and = [
      ...(filter.$and || []),
      { $or: [{ isDeal: true }, { isDealActive: true }] },
    ];
  }
  if (featured === "true") filter.isFeatured = true;
  if (trending === "true") filter.isTrending = true;

  // Text search: collapse into a single filter so the query planner can
  // pick one index instead of running two `.find()` stages.
  if (search) filter.$text = { $search: search };

  const sortMap = {
    priceLow: { minPrice: 1 },
    priceHigh: { minPrice: -1 },
    newest: { createdAt: -1 },
    rating: { averageRating: -1 },
    bestSelling: { totalSales: -1 },
  };
  const sortSpec = sort && sortMap[sort] ? sortMap[sort] : { createdAt: -1 };

  const pageNum = Math.max(Number(page), 1);
  const pageSize = Math.min(Math.max(Number(limit), 1), 100);

  // Trim the list payload: the product card only needs slug/name/price/stock
  // /rating/brand/category. Skipping `description`/`shortDescription` (rich
  // HTML, often several KB each) dramatically reduces the response size on
  // category pages.
  const LIST_PROJECTION =
    "name slug category categories brand status isFeatured isTrending isDeal averageRating minPrice maxPrice totalStock discountPercentage isDealActive dealStart dealEnd totalReviews totalSales createdAt";

  const [items, total] = await Promise.all([
    Product.find(filter)
      .select(LIST_PROJECTION)
      .sort(sortSpec)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .populate("category", "name slug")
      .populate("brand", "name slug logo")
      .lean(),
    Product.countDocuments(filter),
  ]);

  if (items.length) {
    const ids = items.map((p) => p._id);
    // Prefer the thumbnail for list cards; fall back to the first gallery image.
    const mediaRows = await ProductMedia.aggregate([
      { $match: { product: { $in: ids }, type: "image" } },
      { $sort: { isThumbnail: -1, position: 1, createdAt: 1 } },
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

// Single product detail: resolve the product doc, then fan out variants +
// media in parallel. Each of those queries hits a product-indexed field so
// the three-way round-trip comes back as fast as the slowest leg.
const loadProductPayload = async (product) => {
  const [variants, media] = await Promise.all([
    Variant.find({ product: product._id }).lean(),
    ProductMedia.find({ product: product._id })
      .sort({ isThumbnail: -1, position: 1 })
      .lean(),
  ]);
  return { product, variants, media };
};

export const getProductById = async (id) => {
  const product = await Product.findById(id)
    .populate("category", "name slug")
    .populate("brand", "name slug logo")
    .lean();
  if (!product) throw new ApiError(404, "Product not found");
  return loadProductPayload(product);
};

export const getProductBySlug = async (slug) => {
  const product = await Product.findOne({ slug })
    .populate("category", "name slug")
    .populate("brand", "name slug logo")
    .lean();
  if (!product) throw new ApiError(404, "Product not found");
  return loadProductPayload(product);
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
