import { z } from "zod";

const objectId = /^[0-9a-fA-F]{24}$/;

export const createReviewSchema = z.object({
  body: z.object({
    product: z.string().regex(objectId, "Invalid product id"),
    order: z.string().regex(objectId).optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional(),
    // Optional reviewer-supplied photo URL (returned by /uploads/image).
    image: z.string().trim().optional(),
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

// Admin-authored review. The admin can write on behalf of a registered user
// or post anonymously; in the anonymous case `displayName` is shown in place
// of a real user.
export const adminCreateReviewSchema = z.object({
  body: z.object({
    product: z.string().regex(objectId, "Invalid product id"),
    user: z.string().regex(objectId).optional(),
    displayName: z.string().trim().min(1).max(80).optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional(),
    image: z.string().trim().optional(),
    status: z.enum(["pending", "approved", "flagged"]).optional(),
  }),
});

export const adminUpdateReviewSchema = z.object({
  params: z.object({
    id: z.string().regex(objectId, "Invalid review id"),
  }),
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().trim().max(2000).optional(),
    image: z.string().trim().optional(),
    status: z.enum(["pending", "approved", "flagged"]).optional(),
    displayName: z.string().trim().min(1).max(80).optional(),
  }),
});
