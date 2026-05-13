import { z } from "zod";

const objectId = /^[0-9a-fA-F]{24}$/;

const variantSchema = z.object({
  sku: z.string().trim().optional(),
  size: z.string().trim().optional(),
  packSize: z.string().trim().optional(),
  color: z.string().trim().optional(),
  // Strength / dosage label per variant (e.g. "1000mg", "5000 IU"). Free-text
  // because supplements use heterogeneous units. The legacy variant-level
  // `ingredients` string has been replaced by this field; we still accept
  // `ingredients` and `material` here so older admin clients that haven't
  // refreshed don't error out — the service layer drops them.
  potency: z.string().trim().optional(),
  ingredients: z.string().trim().optional(),
  material: z.string().trim().optional(),
  originalPrice: z.number().nonnegative("Original price cannot be negative"),
  salePrice: z.number().nonnegative("Sale price cannot be negative"),
  discountPercentage: z.number().min(0).max(100).optional(),
  // Stock is optional at the API edge: the service layer defaults missing or
  // blank values to 50 so admins don't have to fill it for routine uploads.
  stock: z.number().int().nonnegative("Stock cannot be negative").optional(),
  weight: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

const itemDetailsSchema = z.object({
  itemForm: z.string().trim().optional(),
  containerType: z.string().trim().optional(),
  ageRange: z.string().trim().optional(),
  dosageForm: z.string().trim().optional(),
}).optional();

const faqEntrySchema = z.object({
  question: z.string().trim().min(1, "FAQ question is required"),
  answer: z.string().trim().min(1, "FAQ answer is required"),
});

// "How to use" block — short rich-text/HTML copy + a single image URL.
// The frontend uses TipTap so the body comes through as HTML; we keep the
// shape generic (string + url string) so future plain-text submissions
// also pass through.
const howToUseSchema = z.object({
  text: z.string().trim().optional().default(""),
  image: z.string().trim().optional().default(""),
});

// Same shape as howToUse, used by the new ingredientHighlight block.
const ingredientHighlightSchema = howToUseSchema;

// Why-love-it entries are now a single-input list — just a title. Older
// clients still posting icon/body are tolerated via .passthrough(); the
// service-layer normalizer strips the extras so persistence stays clean.
const whyLoveItEntrySchema = z
  .object({ title: z.string().trim().min(1, "Headline is required") })
  .passthrough();

// Benefits and uses are now { image, items: string[] } — one optional
// section banner plus a flat bullet list. We still accept the legacy
// [{text, image}] array (and plain string[]) for any client that hasn't
// shipped the new admin form yet; the service-layer normalizer coerces
// every write to the canonical object shape.
const contentRowSchema = z.object({
  text: z.string().trim().min(1, "Text is required"),
  image: z.string().trim().optional().default(""),
});
const contentRowOrStringSchema = z.union([contentRowSchema, z.string().trim().min(1)]);

const sectionBlockObjectSchema = z.object({
  image: z.string().trim().optional().default(""),
  items: z.array(z.string().trim().min(1)).optional().default([]),
});

// Accept new object shape OR legacy array. Normalizer flattens on write.
const sectionBlockSchema = z.union([
  sectionBlockObjectSchema,
  z.array(contentRowOrStringSchema),
]);

// Per-type GTIN validators. We persist `barcode` as the raw string and
// `gtinType` as a discriminator so the frontend can mask the input and
// the storefront can emit the right schema.org property.
//   upc  → GTIN-12 (12 digits)
//   ean  → GTIN-13 (13 digits, international retail)
//   isbn → GTIN-10 (9 digits + 0-9 or X check digit)
const GTIN_VALIDATORS = {
  upc: /^\d{12}$/,
  ean: /^\d{13}$/,
  isbn: /^\d{9}[\dXx]$/,
};

const GTIN_LABELS = {
  upc: "UPC must be exactly 12 digits",
  ean: "EAN must be exactly 13 digits",
  isbn: "ISBN must be 10 characters: 9 digits + a check digit (0–9 or X)",
};

// Cross-field check: when a barcode is provided, gtinType must be set
// and the barcode must match its format. When the barcode is empty,
// gtinType is allowed to be empty too.
const refineBarcode = (data, ctx) => {
  const code = (data.barcode || "").trim();
  const type = data.gtinType || "";

  if (!code) {
    // Allow the gtinType to linger when the field is cleared — UI lives.
    return;
  }
  if (!type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["gtinType"],
      message: "Select an identifier type (UPC / EAN / ISBN)",
    });
    return;
  }
  const re = GTIN_VALIDATORS[type];
  if (!re || !re.test(code)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["barcode"],
      message: GTIN_LABELS[type] || "Invalid identifier",
    });
  }
};

const mediaSchema = z.object({
  url: z.string().url("Media url must be a valid URL"),
  filename: z.string().optional(),
  slug: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  alt: z.string().optional(),
  isThumbnail: z.boolean().optional(),
  type: z.enum(["image", "video"]).optional(),
  position: z.number().int().nonnegative().optional(),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").trim(),
    slug: z.string().trim().optional(),
    description: z.string().min(5, "Description is required").trim(),
    shortDescription: z.string().trim().optional(),
    // Meta length is intentionally unbounded. Google truncates at ~60/160
    // chars in the SERP but admins are free to write longer copy — the
    // admin UI shows a soft "used / max" counter and turns red over budget,
    // but never blocks the save. Persist verbatim.
    metaTitle: z.string().trim().optional(),
    metaDescription: z.string().trim().optional(),
    // Raw identifier; format is enforced via the cross-field refine below.
    barcode: z.string().trim().optional().or(z.literal("")),
    gtinType: z.enum(["", "upc", "ean", "isbn"]).optional(),
    benefits: sectionBlockSchema.optional(),
    uses: sectionBlockSchema.optional(),
    howToUse: howToUseSchema.optional(),
    ingredientHighlight: ingredientHighlightSchema.optional(),
    taxPercent: z.coerce.number().min(0).max(100).optional(),
    whyLoveIt: z.array(whyLoveItEntrySchema).optional(),
    precautions: z.array(z.string().trim().min(1)).optional(),
    storage: z.string().trim().optional(),
    faq: z.array(faqEntrySchema).optional(),
    itemDetails: itemDetailsSchema,
    // Many-to-many ingredient tagging. Accepts ObjectIds — frontend resolves
    // names to ids via the ingredient autocomplete.
    ingredients: z.array(z.string().regex(objectId, "Invalid ingredient id")).optional(),
    category: z.string().regex(objectId, "Invalid category id"),
    categories: z.array(z.string().regex(objectId, "Invalid category id")).optional(),
    subCategory: z.string().regex(objectId, "Invalid subCategory id").optional().nullable(),
    brand: z.string().regex(objectId, "Invalid brand id").optional().nullable(),
    // Manufacturer (free-text). Capped at 120 chars so it stays a clean
    // single-line label on the storefront — admins who need a longer
    // legal description should use the description body instead.
    manufacturer: z.string().trim().max(120, "Manufacturer must be 120 characters or fewer").optional(),
    status: z.enum(["draft", "published"]).optional(),
    dealStart: z.string().datetime().optional(),
    dealEnd: z.string().datetime().optional(),
    isFeatured: z.boolean().optional(),
    isTrending: z.boolean().optional(),
    isDeal: z.boolean().optional(),
    variants: z.array(variantSchema).min(1, "At least one variant is required"),
    media: z.array(mediaSchema).optional(),
    thumbnail: mediaSchema.optional(),
  }).superRefine(refineBarcode),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().regex(objectId, "Invalid product id"),
  }),
  body: z.object({
    name: z.string().min(2).trim().optional(),
    slug: z.string().trim().optional(),
    description: z.string().min(5).trim().optional(),
    shortDescription: z.string().trim().optional(),
    metaTitle: z.string().trim().optional(),
    metaDescription: z.string().trim().optional(),
    barcode: z.string().trim().optional().or(z.literal("")),
    gtinType: z.enum(["", "upc", "ean", "isbn"]).optional(),
    benefits: sectionBlockSchema.optional(),
    uses: sectionBlockSchema.optional(),
    howToUse: howToUseSchema.optional(),
    ingredientHighlight: ingredientHighlightSchema.optional(),
    taxPercent: z.coerce.number().min(0).max(100).optional(),
    whyLoveIt: z.array(whyLoveItEntrySchema).optional(),
    precautions: z.array(z.string().trim().min(1)).optional(),
    storage: z.string().trim().optional(),
    faq: z.array(faqEntrySchema).optional(),
    itemDetails: itemDetailsSchema,
    ingredients: z.array(z.string().regex(objectId, "Invalid ingredient id")).optional(),
    category: z.string().regex(objectId).optional(),
    categories: z.array(z.string().regex(objectId)).optional(),
    subCategory: z.string().regex(objectId).optional().nullable(),
    brand: z.string().regex(objectId).optional().nullable(),
    manufacturer: z.string().trim().max(120).optional(),
    status: z.enum(["draft", "published"]).optional(),
    isFeatured: z.boolean().optional(),
    isTrending: z.boolean().optional(),
    isDeal: z.boolean().optional(),
    variants: z.array(variantSchema).optional(),
    media: z.array(mediaSchema).optional(),
    thumbnail: mediaSchema.nullable().optional(),
  }).superRefine(refineBarcode),
});

// Draft-create schema. Mirrors the regular create body but with almost
// every required field relaxed: a name is the only hard floor. The service
// layer handles defensive fallbacks so half-typed admin sessions can be
// persisted without losing data.
export const createDraftProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").trim(),
    slug: z.string().trim().optional(),
    description: z.string().trim().optional(),
    shortDescription: z.string().trim().optional(),
    metaTitle: z.string().trim().optional(),
    metaDescription: z.string().trim().optional(),
    barcode: z.string().trim().optional().or(z.literal("")),
    gtinType: z.enum(["", "upc", "ean", "isbn"]).optional(),
    benefits: sectionBlockSchema.optional(),
    uses: sectionBlockSchema.optional(),
    howToUse: howToUseSchema.optional(),
    ingredientHighlight: ingredientHighlightSchema.optional(),
    taxPercent: z.coerce.number().min(0).max(100).optional(),
    whyLoveIt: z.array(whyLoveItEntrySchema).optional(),
    precautions: z.array(z.string().trim().min(1)).optional(),
    storage: z.string().trim().optional(),
    faq: z.array(faqEntrySchema).optional(),
    itemDetails: itemDetailsSchema.optional(),
    ingredients: z.array(z.string().regex(objectId, "Invalid ingredient id")).optional(),
    // Both category fields are optional on a draft. The model defers its
    // required check to status==='published' so we can persist without one.
    category: z.string().regex(objectId).optional(),
    categories: z.array(z.string().regex(objectId)).optional(),
    subCategory: z.string().regex(objectId).optional().nullable(),
    brand: z.string().regex(objectId).optional().nullable(),
    manufacturer: z.string().trim().max(120).optional(),
    isFeatured: z.boolean().optional(),
    isTrending: z.boolean().optional(),
    isDeal: z.boolean().optional(),
    // Variants on a draft are entirely optional and individual fields are
    // permissive — half-filled rows are dropped by the service. We keep
    // type coercion via .optional()/`coerce` so a numeric input that the
    // browser serialized as a string doesn't trip validation.
    variants: z
      .array(
        z.object({
          sku: z.string().trim().optional(),
          size: z.string().trim().optional(),
          packSize: z.string().trim().optional(),
          color: z.string().trim().optional(),
          potency: z.string().trim().optional(),
          ingredients: z.string().trim().optional(),
          material: z.string().trim().optional(),
          originalPrice: z.coerce.number().nonnegative().optional(),
          salePrice: z.coerce.number().nonnegative().optional(),
          discountPercentage: z.coerce.number().min(0).max(100).optional(),
          stock: z.coerce.number().int().nonnegative().optional(),
          weight: z.coerce.number().nonnegative().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .optional(),
    media: z.array(mediaSchema).optional(),
    thumbnail: mediaSchema.optional(),
  }),
});

export const productIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectId, "Invalid product id"),
  }),
});

export const productSlugParamSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
});

// `POST /products/search` body schema. Mirrors the FilterStore payload —
// every consumer goes through this endpoint so the contract is one place.
export const productSearchSchema = z.object({
  body: z.object({
    // SEO scope (one at a time, mutually exclusive in practice)
    categorySlug: z.string().trim().optional(),
    brandSlug: z.string().trim().optional(),
    ingredientSlug: z.string().trim().optional(),

    // Body-only filters
    brands: z.array(z.string().trim().min(1)).optional(),
    ingredients: z.array(z.string().trim().min(1)).optional(),
    ingredientLogic: z.enum(["and", "or"]).optional(),
    minPrice: z.number().nonnegative().optional(),
    maxPrice: z.number().nonnegative().optional(),
    rating: z.number().min(0).max(5).optional(),
    inStock: z.boolean().optional(),
    onSale: z.boolean().optional(),

    // Pagination + sort
    sort: z.enum(["newest", "priceLow", "priceHigh", "rating", "bestSelling"]).optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),

    // Search (overrides all other filters except scope; service enforces this)
    search: z.string().trim().optional(),
  }),
});
