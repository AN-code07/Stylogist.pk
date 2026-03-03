import { Product } from "./product.model.js";
import { Variant } from "./variant.model.js";
import { ProductMedia } from "./media.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { isValidObjectId } from "mongoose";
import { getDescendantCategoryIds } from "../categories/category.service.js";
import slugify from "slugify";

export const createProduct = async (payload) => {
  const { variants, media, category, brand, name, slug, ...productData } = payload;

  // Validate category and brand
  if (!isValidObjectId(category)) throw new ApiError(400, "Invalid category ID");
  if (brand && !isValidObjectId(brand)) throw new ApiError(400, "Invalid brand ID");

  productData.category = category;
  productData.brand = brand;

  // Generate slug if not provided
  let productSlug = slug || slugify(name, { lower: true, strict: true });

  // Ensure uniqueness
  let counter = 1;
  while (await Product.findOne({ slug: productSlug })) {
    productSlug = `${slugify(name, { lower: true, strict: true })}-${counter}`;
    counter++;
  }

  productData.slug = productSlug;

  // Create product
  const product = await Product.create({ name, ...productData });

  // Create variants
  if (variants?.length) {
    const variantDocs = variants.map((v) => ({ ...v, product: product._id }));
    await Variant.insertMany(variantDocs);
  }

  // Compute aggregated fields
  if (variants?.length) {
    const prices = variants.map(v => v.salePrice);
    const stocks = variants.map(v => v.stock);

    await Product.findByIdAndUpdate(product._id, {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      totalStock: stocks.reduce((a, b) => a + b, 0),
      discountPercentage: Math.max(...variants.map(v => v.discountPercentage || 0))
    });
  }

  // Create media
  if (media?.length) {
    const mediaDocs = media.map((m) => ({ ...m, product: product._id }));
    await ProductMedia.insertMany(mediaDocs);
  }

  return product;
};

export const getAllProducts = async (query) => {
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
    search
  } = query;

  const filter = { status: "published" };

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

  // Search
  if (search) {
    mongoQuery = mongoQuery.find({ $text: { $search: search } });
  }

  // Sorting
  const sortMap = {
    priceLow: { minPrice: 1 },
    priceHigh: { minPrice: -1 },
    newest: { createdAt: -1 },
    rating: { averageRating: -1 },
    bestSelling: { totalSales: -1 }
  };

  if (sort && sortMap[sort]) {
    mongoQuery = mongoQuery.sort(sortMap[sort]);
  } else {
    mongoQuery = mongoQuery.sort({ createdAt: -1 });
  }

  const products = await mongoQuery
    .skip((page - 1) * limit)
    .limit(Number(limit));

  return products;
};

export const getSingleProduct = async (slug) => {
  const product = await Product.findOne({ slug, status: "published" }).populate("category")
    .populate("brand");

  console.log("im product......", product);


  if (!product) throw new ApiError(404, "Product not found");

  const variants = await Variant.find({ product: product._id });
  const media = await ProductMedia.find({ product: product._id }).sort({ position: 1 });

  return { product, variants, media };
};