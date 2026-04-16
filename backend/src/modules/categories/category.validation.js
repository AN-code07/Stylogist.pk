import { z } from "zod";

const objectId = /^[0-9a-fA-F]{24}$/;

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, "Category name must be at least 2 characters").trim(),
    description: z.string().trim().optional(),
    parent: z.string().regex(objectId, "Invalid parent id").nullable().optional(),
    image: z.string().url().optional().or(z.literal("")).nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(objectId, "Invalid category id"),
  }),
  body: z.object({
    name: z.string().min(2).trim().optional(),
    description: z.string().trim().optional(),
    parent: z.string().regex(objectId).nullable().optional(),
    image: z.string().url().optional().or(z.literal("")).nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectId, "Invalid category id"),
  }),
});
