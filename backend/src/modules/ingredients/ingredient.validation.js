import { z } from "zod";

const objectId = /^[0-9a-fA-F]{24}$/;

const faqSchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(500),
  answer: z.string().trim().min(1, "Answer is required").max(2000),
});

export const createIngredientSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").trim(),
    slug: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    // Meta length is advisory only — UI counter signals the SERP budget
    // but never blocks the save.
    metaTitle: z.string().trim().optional(),
    metaDescription: z.string().trim().optional(),
    image: z.string().url().optional().or(z.literal("")).nullable(),
    benefits: z.array(z.string().trim().min(1)).optional(),
    uses: z.array(z.string().trim().min(1)).optional(),
    faq: z.array(faqSchema).optional(),
    isIndexable: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateIngredientSchema = z.object({
  params: z.object({
    id: z.string().regex(objectId, "Invalid ingredient id"),
  }),
  body: z.object({
    name: z.string().min(2).trim().optional(),
    slug: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    metaTitle: z.string().trim().optional(),
    metaDescription: z.string().trim().optional(),
    image: z.string().url().optional().or(z.literal("")).nullable(),
    benefits: z.array(z.string().trim().min(1)).optional(),
    uses: z.array(z.string().trim().min(1)).optional(),
    faq: z.array(faqSchema).optional(),
    isIndexable: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const ingredientIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectId, "Invalid ingredient id"),
  }),
});

export const ingredientSlugParamSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
});
