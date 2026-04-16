import { z } from "zod";

const objectId = /^[0-9a-fA-F]{24}$/;

export const createBrandSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Brand name must be at least 2 characters").trim(),
    description: z.string().trim().optional(),
    logo: z.string().url("Logo must be a valid URL").optional().or(z.literal("")).nullable(),
    website: z.string().url("Website must be a valid URL").optional().or(z.literal("")),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateBrandSchema = z.object({
  params: z.object({
    id: z.string().regex(objectId, "Invalid brand id"),
  }),
  body: z.object({
    name: z.string().min(2).trim().optional(),
    description: z.string().trim().optional(),
    logo: z.string().url().optional().or(z.literal("")).nullable(),
    website: z.string().url().optional().or(z.literal("")),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const brandIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectId, "Invalid brand id"),
  }),
});
