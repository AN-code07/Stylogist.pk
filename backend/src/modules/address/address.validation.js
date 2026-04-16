import { z } from 'zod';

export const createAddressSchema = z.object({
  body: z.object({
    label: z.string().min(2, 'Label is required'),
    addressLine1: z.string().min(5, 'Address line 1 is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    postalCode: z.string().min(3, 'Postal code is required'),
    country: z.string().min(2, 'Country is required'),
    isDefault: z.boolean().optional(),
  }),
});

export const updateAddressSchema = z.object({
  body: z.object({
    label: z.string().min(2).optional(),
    addressLine1: z.string().min(5).optional(),
    addressLine2: z.string().optional(),
    city: z.string().min(2).optional(),
    state: z.string().min(2).optional(),
    postalCode: z.string().min(3).optional(),
    country: z.string().min(2).optional(),
    isDefault: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Address ID is required'),
  }),
});

export const addressIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Address ID is required'),
  }),
});