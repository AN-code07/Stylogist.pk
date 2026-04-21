import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const itemsSchema = z
  .array(
    z.object({
      productId: z.string().regex(objectIdRegex, "Invalid productId"),
      sku: z.string().min(1, "SKU required"),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
    })
  )
  .min(1, "Order must contain at least one item");

const guestInfoSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(7, "Phone is required"),
});

const guestAddressSchema = z.object({
  label: z.string().optional(),
  addressLine1: z.string().min(3, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "Province/state is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

// Accept EITHER (registered) `addressId` OR (guest) `guest` + `guestAddress`.
// The service layer throws if neither branch is satisfied for the caller.
export const createOrderSchema = z.object({
  body: z
    .object({
      items: itemsSchema,
      addressId: z.string().regex(objectIdRegex, "Invalid addressId").optional(),
      guest: guestInfoSchema.optional(),
      guestAddress: guestAddressSchema.optional(),
      paymentMethod: z.enum(["COD"]).optional(),
    })
    .refine((b) => b.addressId || (b.guest && b.guestAddress), {
      message: "Provide either a saved addressId or guest + guestAddress",
      path: ["addressId"],
    }),
});
