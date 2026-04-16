import { z } from "zod";

const objectId = /^[0-9a-fA-F]{24}$/;

export const createReviewSchema = z.object({
  body: z.object({
    product: z.string().regex(objectId, "Invalid product id"),
    order: z.string().regex(objectId).optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional(),
  }),
});

export const updateReviewStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectId, "Invalid review id"),
  }),
  body: z.object({
    status: z.enum(["pending", "approved", "flagged"]),
  }),
});

export const reviewIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectId, "Invalid review id"),
  }),
});
