import { z } from "zod";

const objectId = /^[0-9a-fA-F]{24}$/;

const variantSchema = z.object({
  sku: z.string().trim().optional(),
  size: z.string().trim().optional(),
  color: z.string().trim().optional(),
  material: z.string().trim().optional(),
  originalPrice: z.number().nonnegative("Original price cannot be negative"),
  salePrice: z.number().nonnegative("Sale price cannot be negative"),
  discountPercentage: z.number().min(0).max(100).optional(),
  stock: z.number().int().nonnegative("Stock cannot be negative"),
  weight: z.number().nonnegative().optional(),
});

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
    metaTitle: z.string().trim().optional(),
    metaDescription: z.string().trim().optional(),
    category: z.string().regex(objectId, "Invalid category id"),
    categories: z.array(z.string().regex(objectId, "Invalid category id")).optional(),
    subCategory: z.string().regex(objectId, "Invalid subCategory id").optional().nullable(),
    brand: z.string().regex(objectId, "Invalid brand id").optional().nullable(),
    status: z.enum(["draft", "published"]).optional(),
    dealStart: z.string().datetime().optional(),
    dealEnd: z.string().datetime().optional(),
    isFeatured: z.boolean().optional(),
    isTrending: z.boolean().optional(),
    isDeal: z.boolean().optional(),
    variants: z.array(variantSchema).min(1, "At least one variant is required"),
    media: z.array(mediaSchema).optional(),
    thumbnail: mediaSchema.optional(),
  }),
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
    category: z.string().regex(objectId).optional(),
    categories: z.array(z.string().regex(objectId)).optional(),
    subCategory: z.string().regex(objectId).optional().nullable(),
    brand: z.string().regex(objectId).optional().nullable(),
    status: z.enum(["draft", "published"]).optional(),
    isFeatured: z.boolean().optional(),
    isTrending: z.boolean().optional(),
    isDeal: z.boolean().optional(),
    variants: z.array(variantSchema).optional(),
    media: z.array(mediaSchema).optional(),
    thumbnail: mediaSchema.nullable().optional(),
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
