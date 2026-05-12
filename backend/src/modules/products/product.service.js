import { Product } from "./product.model.js";
import { Variant } from "./variant.model.js";
import { ProductMedia } from "./media.model.js";
import { Category } from "../categories/category.model.js";
import { Brand } from "../brands/brand.model.js";
import { Ingredient } from "../ingredients/ingredient.model.js";
import { SeoRedirect } from "../seo/redirect.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { isValidObjectId } from "mongoose";
import { getDescendantCategoryIds } from "../categories/category.service.js";
import { generateUniqueSlug } from "../../utils/slug.js";
import { generateVariantSku } from "../../utils/sku.js";

// Derive aggregate pricing/stock fields from the variant list in one pass.
// Exported for unit tests; in the service flow it's called inline below.
export const aggregateFromVariants = (variants) => {
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

// Normalize a variant payload from the admin form. The variant-level
// `ingredients` text field has been retired in favour of `potency`
// (e.g. "1000mg", "5000 IU") — older clients posting `ingredients` /
// `material` are tolerated but those values are dropped so the row
// stays clean. Stock falls back to 50 when omitted.
// Exported for unit tests — the rest of the service treats this as an
// internal helper.
export const normalizeVariant = (v) => {
  // Pull `ingredients` and `material` out of the spread so they never
  // reach the persistence layer; potency is the only authoritative
  // strength label going forward.
  const { material, ingredients, potency, stock, ...rest } = v;
  const stockNumber = Number(stock);
  return {
    ...rest,
    potency: (potency ?? "").toString().trim(),
    stock: Number.isFinite(stockNumber) && stockNumber >= 0 ? stockNumber : 50,
  };
};

// Strip HTML tags + collapse whitespace. Cheap (no DOM) — fine for short copy.
const stripHtml = (html) =>
  String(html ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

// Single "How to use" block — short rich-text/HTML copy + an optional
// image URL. Empty fields are tolerated; both blank means "don't render
// the section on the storefront".
const normalizeHowToUse = (raw) => {
  if (!raw || typeof raw !== "object") return { text: "", image: "" };
  return {
    text: (raw.text ?? "").toString().trim(),
    image: (raw.image ?? "").toString().trim(),
  };
};

// `ingredientHighlight` is the same shape — reuse the same normalizer
// so future schema changes only touch one place.
const normalizeIngredientHighlight = normalizeHowToUse;

// Benefits + uses moved from string[] to {text, image}[] so each bullet
// can carry an optional banner image. Older payloads (plain strings,
// legacy `[{text, image?}]`) all flow through this normalizer.
const normalizeContentList = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (typeof row === "string") {
        const t = row.trim();
        return t ? { text: t, image: "" } : null;
      }
      if (row && typeof row === "object") {
        const text = (row.text ?? "").toString().trim();
        const image = (row.image ?? "").toString().trim();
        return text ? { text, image } : null;
      }
      return null;
    })
    .filter(Boolean);
};

// Why-love-it is now a single-input list. We accept anything with a
// `title` and ignore the legacy `icon` / `body` fields entirely so the
// stored shape stays clean.
const normalizeWhyLoveIt = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const title = (row?.title ?? "").toString().trim();
      return title ? { title } : null;
    })
    .filter(Boolean);
};

// Build SEO defaults from the product. We only fill these in when the admin
// left the corresponding field blank — explicit input always wins.
const deriveSeoDefaults = ({ name, description, shortDescription, brandName }) => {
  const title = brandName ? `${name} | ${brandName} | Stylogist` : `${name} | Stylogist`;
  const blurb = stripHtml(shortDescription) || stripHtml(description);
  return {
    metaTitle: title.slice(0, 60),
    metaDescription: blurb.slice(0, 160),
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
  const {
    variants,
    media = [],
    thumbnail,
    category,
    categories,
    brand,
    subCategory,
    name,
    slug,
    metaTitle = "",
    metaDescription = "",
    barcode = "",
    gtinType = "",
    benefits = [],
    uses = [],
    howToUse,
    ingredientHighlight,
    whyLoveIt = [],
    faq = [],
    itemDetails = {},
    ingredients: ingredientIds = [],
    ...rest
  } = payload;

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

  const normalizedVariants = variants.map(normalizeVariant);
  const aggregates = aggregateFromVariants(normalizedVariants);

  // Normalize the multi-select list: always include the primary category and
  // deduplicate so MongoDB stores a clean array.
  const categoriesList = Array.isArray(categories) && categories.length
    ? [...new Set([category, ...categories])]
    : [category];

  // Auto-fill meta when the admin left it blank — saves them the SEO step
  // for routine catalogue uploads while keeping the option to override.
  const seoDefaults = deriveSeoDefaults({
    name,
    description: rest.description,
    shortDescription: rest.shortDescription,
    brandName: brandDoc?.name,
  });
  const finalMetaTitle = (metaTitle && metaTitle.trim()) || seoDefaults.metaTitle;
  const finalMetaDescription = (metaDescription && metaDescription.trim()) || seoDefaults.metaDescription;

  const product = await Product.create({
    ...rest,
    name,
    slug: productSlug,
    metaTitle: finalMetaTitle,
    metaDescription: finalMetaDescription,
    barcode,
    // Persist the discriminator only when there's an actual code; an empty
    // gtinType keeps the index entry tidy.
    gtinType: barcode && gtinType ? gtinType : "",
    benefits: normalizeContentList(benefits),
    uses: normalizeContentList(uses),
    whyLoveIt: normalizeWhyLoveIt(whyLoveIt),
    howToUse: normalizeHowToUse(howToUse),
    ingredientHighlight: normalizeIngredientHighlight(ingredientHighlight),
    faq: Array.isArray(faq)
      ? faq
          .map((q) => ({
            question: (q?.question || "").toString().trim(),
            answer: (q?.answer || "").toString().trim(),
          }))
          .filter((q) => q.question && q.answer)
      : [],
    itemDetails: itemDetails || {},
    ingredients: Array.isArray(ingredientIds) ? [...new Set(ingredientIds)] : [],
    category,
    categories: categoriesList,
    subCategory: subCategory || undefined,
    brand: brand || undefined,
    ...aggregates,
  });

  const variantDocs = normalizedVariants.map((v) => {
    const sku =
      v.sku?.trim() ||
      generateVariantSku({
        brandName: brandDoc?.name,
        categoryName: categoryDoc.name,
        productSlug,
        attrs: [v.color, v.size, v.packSize].filter(Boolean),
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

// Lightweight draft creation. Mirrors `createProduct` but tolerates
// missing fields: an admin who types a name and then bounces should not
// lose their work. Variant/media inserts only fire when arrays are non-
// empty so a bare-name draft still persists. status is forced to 'draft'
// regardless of payload; promoting to 'published' goes through the
// regular updateProduct flow (which re-runs the full required-field
// validation via the Product schema).
export const createDraftProduct = async (payload = {}) => {
  const {
    variants = [],
    media = [],
    thumbnail,
    category,
    categories,
    brand,
    subCategory,
    name,
    slug,
    metaTitle = "",
    metaDescription = "",
    benefits,
    uses,
    whyLoveIt,
    howToUse,
    ingredientHighlight,
    ...rest
  } = payload;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Name is required to save a draft");
  }

  // Resolve optional references defensively — invalid ids on a draft are
  // dropped rather than erroring out, since the admin will fix them at
  // publish time anyway.
  let categoryDoc = null;
  if (category && isValidObjectId(category)) {
    categoryDoc = await Category.findById(category);
  }
  let brandDoc = null;
  if (brand && isValidObjectId(brand)) {
    brandDoc = await Brand.findById(brand);
  }

  const productSlug = slug?.trim()
    ? await generateUniqueSlug(Product, slug.trim())
    : await generateUniqueSlug(Product, `${name.trim()}-draft-${Date.now()}`);

  // Only emit aggregates when we have priced variants; otherwise leave the
  // denormalized columns at their defaults so the draft doesn't pretend
  // to be sellable.
  const pricedVariants = Array.isArray(variants)
    ? variants.filter((v) => Number.isFinite(Number(v.salePrice)))
    : [];
  const aggregates = pricedVariants.length
    ? aggregateFromVariants(pricedVariants.map(normalizeVariant))
    : { minPrice: 0, maxPrice: 0, totalStock: 0, discountPercentage: 0 };

  // Multi-category list mirrors the regular create path — first selected
  // is the primary so existing queries keep matching after publish.
  const categoryList = Array.isArray(categories)
    ? [...new Set(categories.filter(Boolean).map(String))]
    : [];
  if (categoryDoc && !categoryList.includes(String(categoryDoc._id))) {
    categoryList.unshift(String(categoryDoc._id));
  }

  const product = await Product.create({
    ...rest,
    name: name.trim(),
    slug: productSlug,
    metaTitle,
    metaDescription,
    category: categoryDoc ? categoryDoc._id : undefined,
    categories: categoryList,
    subCategory: subCategory && isValidObjectId(subCategory) ? subCategory : undefined,
    brand: brandDoc ? brandDoc._id : undefined,
    benefits: normalizeContentList(benefits),
    uses: normalizeContentList(uses),
    whyLoveIt: normalizeWhyLoveIt(whyLoveIt),
    howToUse: normalizeHowToUse(howToUse),
    ingredientHighlight: normalizeIngredientHighlight(ingredientHighlight),
    status: "draft",
    ...aggregates,
  });

  // Variants only get persisted when at least one carries a salePrice —
  // half-typed variant rows are dropped rather than failing the save.
  if (pricedVariants.length) {
    const variantDocs = pricedVariants.map((v) => {
      const normalized = normalizeVariant(v);
      const sku =
        normalized.sku?.trim() ||
        generateVariantSku({
          brandName: brandDoc?.name,
          categoryName: categoryDoc?.name,
          productSlug,
          attrs: [normalized.color, normalized.size].filter(Boolean),
        });
      return { ...normalized, sku, product: product._id };
    });
    try {
      await Variant.insertMany(variantDocs, { ordered: true });
    } catch (err) {
      // Don't roll back the product — a draft with no variants is still
      // a valid recovery point. Log and continue.
      if (err?.code !== 11000) {
        // 11000 = duplicate SKU; swallow on drafts since user will retry
        // with a real SKU at publish time.
        console.warn("Draft variant insertMany warning:", err?.message);
      }
    }
  }

  const mediaDocs = buildMediaDocs({
    thumbnail,
    media,
    productId: product._id,
    productSlug,
    metaTitle,
    metaDescription,
  });
  if (mediaDocs.length) {
    try {
      await ProductMedia.insertMany(mediaDocs);
    } catch (err) {
      console.warn("Draft media insertMany warning:", err?.message);
    }
  }

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
    barcode,
    barcode: nextBarcode,
    gtinType: nextGtinType,
    benefits,
    uses,
    whyLoveIt: whyLoveItPatch,
    howToUse: howToUsePatch,
    ingredientHighlight: ingredientHighlightPatch,
    faq,
    itemDetails,
    ingredients: ingredientIds,
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
    const oldSlug = product.slug;
    product.slug = await generateUniqueSlug(Product, slug.trim(), id);
    // Drop a 301 redirect for the previous URL so existing backlinks and
    // search-engine entries survive the rename. We upsert so a chain of
    // renames stays at one row per old slug, pointing at the latest one.
    if (oldSlug && oldSlug !== product.slug) {
      try {
        await SeoRedirect.findOneAndUpdate(
          { fromPath: `/product/${oldSlug}` },
          {
            fromPath: `/product/${oldSlug}`,
            toPath: `/product/${product.slug}`,
            kind: "product",
            statusCode: 301,
            sourceProduct: product._id,
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        // Don't fail the whole product update on a redirect-write error;
        // the rename itself is more important than the SEO bookkeeping.
        console.warn("Failed to persist slug redirect:", err?.message);
      }
    }
  }

  if (metaTitle !== undefined) product.metaTitle = metaTitle;
  if (metaDescription !== undefined) product.metaDescription = metaDescription;
  if (nextBarcode !== undefined) product.barcode = nextBarcode;
  if (nextGtinType !== undefined) {
    // Clear the discriminator when the code itself is empty so we never
    // end up with `gtinType=ean, barcode=""` orphan rows.
    product.gtinType = product.barcode && nextGtinType ? nextGtinType : "";
  }
  if (Array.isArray(benefits)) product.benefits = normalizeContentList(benefits);
  if (Array.isArray(uses)) product.uses = normalizeContentList(uses);
  if (Array.isArray(whyLoveItPatch)) {
    product.whyLoveIt = normalizeWhyLoveIt(whyLoveItPatch);
  }
  if (howToUsePatch !== undefined) {
    // Authoritative replace — sending {} clears the block. Empty fields
    // tell the storefront to hide the section.
    product.howToUse = normalizeHowToUse(howToUsePatch);
  }
  if (ingredientHighlightPatch !== undefined) {
    product.ingredientHighlight = normalizeIngredientHighlight(ingredientHighlightPatch);
  }
  if (Array.isArray(faq)) {
    // Authoritative replace + sanity trim. Empty rows get dropped so
    // the public FAQPage JSON-LD never emits incomplete entries.
    product.faq = faq
      .map((q) => ({
        question: (q?.question || "").toString().trim(),
        answer: (q?.answer || "").toString().trim(),
      }))
      .filter((q) => q.question && q.answer);
  }
  if (itemDetails !== undefined) {
    // Replace as a whole so removing a key on the client clears it server-side.
    product.itemDetails = itemDetails || {};
  }
  if (Array.isArray(ingredientIds)) {
    // Authoritative replace — admin form sends the final desired set.
    product.ingredients = [...new Set(ingredientIds)];
  }

  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined) product[key] = value;
  });

  const normalizedVariants = Array.isArray(variants) && variants.length
    ? variants.map(normalizeVariant)
    : null;

  if (normalizedVariants) {
    const aggregates = aggregateFromVariants(normalizedVariants);
    product.minPrice = aggregates.minPrice;
    product.maxPrice = aggregates.maxPrice;
    product.totalStock = aggregates.totalStock;
    product.discountPercentage = aggregates.discountPercentage;
  }

  await product.save();

  if (normalizedVariants) {
    const categoryDoc = await Category.findById(product.category);
    const brandDoc = product.brand ? await Brand.findById(product.brand) : null;
    await Variant.deleteMany({ product: product._id });
    const variantDocs = normalizedVariants.map((v) => {
      const sku =
        v.sku?.trim() ||
        generateVariantSku({
          brandName: brandDoc?.name,
          categoryName: categoryDoc?.name,
          productSlug: product.slug,
          attrs: [v.color, v.size, v.packSize].filter(Boolean),
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
    ingredient, // single slug
    ingredients, // CSV slugs (multi-select filter)
    ingredientLogic, // 'and' | 'or' (default 'or')
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

  // Ingredient filter — accepts a single slug, a CSV of slugs, or both. We
  // resolve slugs to ObjectIds once so the resulting query hits the
  // multikey index on `product.ingredients`.
  const ingredientSlugs = [
    ...(ingredient ? [ingredient] : []),
    ...((ingredients || "").toString().split(",").map((s) => s.trim()).filter(Boolean)),
  ];
  if (ingredientSlugs.length) {
    const ingredientDocs = await Ingredient.find({ slug: { $in: [...new Set(ingredientSlugs)] } })
      .select("_id")
      .lean();
    const ingredientIds = ingredientDocs.map((d) => d._id);
    if (ingredientIds.length) {
      // 'and' = product must contain every selected ingredient; 'or' = any.
      const op = (ingredientLogic || "").toLowerCase() === "and" ? "$all" : "$in";
      filter.ingredients = { [op]: ingredientIds };
    } else {
      // No matching ingredients — short-circuit to an empty result rather
      // than silently dropping the filter and returning everything.
      return { items: [], pagination: { page: 1, limit: Number(limit) || 12, total: 0, pages: 0 } };
    }
  }

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
    .populate("ingredients", "name slug image")
    .lean();
  if (!product) throw new ApiError(404, "Product not found");
  return loadProductPayload(product);
};

export const getProductBySlug = async (slug) => {
  const product = await Product.findOne({ slug })
    .populate("category", "name slug")
    .populate("brand", "name slug logo")
    .populate("ingredients", "name slug image")
    .lean();
  if (product) return loadProductPayload(product);

  // Slug not found — check the redirect map. If the requested URL has been
  // renamed, surface the new slug to the controller via a tagged ApiError
  // so the controller can issue a true 301 redirect instead of a 404.
  // Chains collapse because every rename rewrites the SAME `fromPath`
  // row to point at the latest slug.
  const redirect = await SeoRedirect.findOne({ fromPath: `/product/${slug}` }).lean();
  if (redirect?.toPath) {
    const err = new ApiError(301, "Moved permanently");
    err.redirectTo = redirect.toPath;
    err.statusCode = redirect.statusCode || 301;
    throw err;
  }

  throw new ApiError(404, "Product not found");
};

// Body-driven search endpoint backing the new ProductsPage. The frontend
// FilterStore submits its full state here so the URL never leaks filter
// query params. Resolves slug-based scopes (category/brand/ingredient) to
// IDs so we can hit the existing indexes in `getAllProducts`.
export const searchProducts = async (body = {}) => {
  const {
    categorySlug,
    brandSlug,
    ingredientSlug,
    brands = [],
    ingredients = [],
    ingredientLogic,
    minPrice,
    maxPrice,
    rating,
    inStock,
    onSale,
    sort,
    page,
    limit,
    search,
  } = body;

  // Search nukes everything except the SEO scope (rule: applying a search
  // resets all filters). The service enforces this so it's not bypassable
  // from a misbehaving client.
  const useSearchOverride = !!(search && search.trim());

  // Resolve scope slugs → IDs with a single round-trip per scope.
  let categoryId;
  if (categorySlug) {
    const cat = await Category.findOne({ slug: categorySlug }).select("_id").lean();
    if (!cat) {
      return {
        items: [],
        pagination: { page: 1, limit: Number(limit) || 12, total: 0, pages: 0 },
        scope: { type: "category", slug: categorySlug, notFound: true },
      };
    }
    categoryId = cat._id;
  }

  let brandIdAnchor;
  if (brandSlug) {
    const br = await Brand.findOne({ slug: brandSlug }).select("_id name").lean();
    if (!br) {
      return {
        items: [],
        pagination: { page: 1, limit: Number(limit) || 12, total: 0, pages: 0 },
        scope: { type: "brand", slug: brandSlug, notFound: true },
      };
    }
    brandIdAnchor = br._id;
  }

  // The multi-select brand filter goes through brand slugs; resolve them all
  // in one query so the downstream filter takes ObjectIds.
  let brandIds;
  if (!useSearchOverride && brands.length) {
    const brandDocs = await Brand.find({ slug: { $in: brands } }).select("_id").lean();
    brandIds = brandDocs.map((b) => b._id);
  }

  // Compose the ingredient slug list: anchor + multi-select. Keep them as
  // slugs because `getAllProducts` already accepts CSV-of-slugs.
  const ingredientSlugList = useSearchOverride
    ? (ingredientSlug ? [ingredientSlug] : [])
    : [
        ...(ingredientSlug ? [ingredientSlug] : []),
        ...(Array.isArray(ingredients) ? ingredients : []),
      ];

  const query = {
    sort,
    page,
    limit,
    search: useSearchOverride ? search.trim() : undefined,
  };

  if (categoryId) query.category = categoryId;
  if (brandIdAnchor) query.brand = brandIdAnchor;
  // Multi-brand filter is OR-style by passing `$in` brand IDs through the
  // existing `brand` filter. When both anchor + multi exist, the multi
  // overrides — admins shouldn't combine them in the UI.
  if (!brandIdAnchor && brandIds && brandIds.length === 1) query.brand = brandIds[0];

  if (!useSearchOverride) {
    if (minPrice != null) query.minPrice = minPrice;
    if (maxPrice != null) query.maxPrice = maxPrice;
    if (rating) query.rating = rating;
    if (inStock) query.inStock = "true";
    if (onSale) query.deal = "true";
  }
  if (ingredientSlugList.length) {
    query.ingredients = [...new Set(ingredientSlugList)].join(",");
    if (!useSearchOverride && ingredientLogic === "and") query.ingredientLogic = "and";
  }

  const result = await getAllProducts(query);

  // Multi-brand path that needs $in (more than one brand selected) — we
  // handle it here in a dedicated branch so we don't have to touch the
  // shared filter builder.
  if (!brandIdAnchor && brandIds && brandIds.length > 1) {
    // Re-run with a custom filter. We piggyback on getAllProducts by passing
    // a single brand and then post-filtering, but that would double-query.
    // Instead, do a lean direct query mirroring getAllProducts shape.
    return searchProductsMultiBrand({ ...body, brandIds });
  }

  return result;
};

// Direct query path for the rare case the user picks 2+ brands at once.
// Kept narrow on purpose — we only support the multi-brand projection,
// nothing else. All other filters re-use the same building blocks.
const searchProductsMultiBrand = async ({
  brandIds,
  categorySlug,
  ingredientSlug,
  ingredients = [],
  ingredientLogic,
  minPrice,
  maxPrice,
  rating,
  inStock,
  onSale,
  sort,
  page = 1,
  limit = 12,
}) => {
  const filter = { status: "published", brand: { $in: brandIds } };

  if (categorySlug) {
    const cat = await Category.findOne({ slug: categorySlug }).select("_id").lean();
    if (!cat) return { items: [], pagination: { page: 1, limit, total: 0, pages: 0 } };
    const ids = await getDescendantCategoryIds(cat._id);
    filter.$or = [{ category: { $in: ids } }, { categories: { $in: ids } }];
  }

  if (minPrice != null || maxPrice != null) {
    filter.minPrice = {};
    if (minPrice != null) filter.minPrice.$gte = Number(minPrice);
    if (maxPrice != null) filter.minPrice.$lte = Number(maxPrice);
  }
  if (rating) filter.averageRating = { $gte: Number(rating) };
  if (inStock) filter.totalStock = { $gt: 0 };
  if (onSale) filter.$and = [...(filter.$and || []), { $or: [{ isDeal: true }, { isDealActive: true }] }];

  const slugList = [...(ingredientSlug ? [ingredientSlug] : []), ...ingredients];
  if (slugList.length) {
    const docs = await Ingredient.find({ slug: { $in: [...new Set(slugList)] } }).select("_id").lean();
    if (!docs.length) return { items: [], pagination: { page: 1, limit, total: 0, pages: 0 } };
    const op = ingredientLogic === "and" ? "$all" : "$in";
    filter.ingredients = { [op]: docs.map((d) => d._id) };
  }

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
  const LIST_PROJECTION =
    "name slug category categories brand status averageRating minPrice maxPrice totalStock discountPercentage totalReviews totalSales createdAt";

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
