import jwt from "jsonwebtoken";
import { User } from "../../modules/users/user.model.js";
import { Category } from "../../modules/categories/category.model.js";
import { Brand } from "../../modules/brands/brand.model.js";
import { Product } from "../../modules/products/product.model.js";
import { Variant } from "../../modules/products/variant.model.js";
import { Address } from "../../modules/address/address.model.js";
import Order from "../../modules/orders/order.model.js";
import env from "../../config/env.js";

// Centralised test seeds. Each helper does just enough to satisfy the
// model's required fields — tests should override anything specific.

let userCounter = 0;

export const seedAdminUser = async (overrides = {}) => {
  // Email + phone are unique-indexed on the User model; counter keeps
  // every call unique so tests can spin up multiple admins in one run.
  userCounter += 1;
  const user = await User.create({
    name: "Test Admin",
    email: `admin${userCounter}@stylogist.test`,
    phone: `0300000${String(1000 + userCounter).padStart(4, "0")}`,
    // Bcrypt-hashed value of "Password1!" via the user.model pre-save hook.
    password: "Password1!",
    role: "Super Admin",
    isVerified: true,
    ...overrides,
  });
  return user;
};

// Mints a real JWT signed with the test JWT_SECRET (set in vitest.config).
// Mirrors what auth.controller.login does at runtime so authMiddleware
// accepts it transparently.
export const signTokenFor = (user) =>
  jwt.sign({ id: user._id.toString() }, env.jwtSecret, { expiresIn: "1h" });

// One-stop helper: creates an admin and returns an `Authorization: Bearer`
// header ready to spread into supertest's `.set(...)` call.
export const seedAdminAuth = async (overrides) => {
  const user = await seedAdminUser(overrides);
  const token = signTokenFor(user);
  return { user, token, authHeader: { Authorization: `Bearer ${token}` } };
};

let categoryCounter = 0;
export const seedCategory = async (overrides = {}) => {
  categoryCounter += 1;
  return Category.create({
    name: `Test Category ${categoryCounter}`,
    slug: `test-category-${categoryCounter}-${Date.now()}`,
    isActive: true,
    ...overrides,
  });
};

let brandCounter = 0;
export const seedBrand = async (overrides = {}) => {
  brandCounter += 1;
  return Brand.create({
    name: `Test Brand ${brandCounter}`,
    slug: `test-brand-${brandCounter}-${Date.now()}`,
    isActive: true,
    ...overrides,
  });
};

// Builds a minimal-valid create-product body keyed off the seeded
// category/brand. Spread overrides last so tests can override any field.
export const buildProductPayload = ({ category, brand, ...overrides } = {}) => ({
  name: "Test Whey Protein 2lb",
  description: "Premium imported whey protein for daily strength training.",
  shortDescription: "Premium whey, 2lb tub.",
  category: category?._id?.toString(),
  brand: brand?._id?.toString(),
  status: "published",
  variants: [
    {
      sku: `WHEY-${Date.now()}`,
      size: "2lb",
      originalPrice: 6500,
      salePrice: 4999,
      stock: 25,
    },
  ],
  ...overrides,
});

// Seed a regular (non-admin) verified customer. Used by review eligibility,
// order, and address tests where we need a real user-shaped JWT.
export const seedCustomer = async (overrides = {}) => {
  userCounter += 1;
  return User.create({
    name: "Test Customer",
    email: `customer${userCounter}@stylogist.test`,
    phone: `0311000${String(1000 + userCounter).padStart(4, "0")}`,
    password: "Password1!",
    role: "User",
    isVerified: true,
    ...overrides,
  });
};

export const seedCustomerAuth = async (overrides) => {
  const user = await seedCustomer(overrides);
  const token = signTokenFor(user);
  return { user, token, authHeader: { Authorization: `Bearer ${token}` } };
};

// Persists a published product + single variant directly via Mongoose so
// tests that need a target product (orders, reviews, slug redirects) can
// skip the HTTP create round-trip. Aggregates are written by hand so
// queries against minPrice/totalStock match without re-running the
// service. Returns `{ product, variant, category, brand }` for easy
// destructuring in tests.
let skuCounter = 0;
export const seedPublishedProduct = async ({
  category,
  brand,
  name = "Seeded Whey",
  variantOverrides = {},
  ...productOverrides
} = {}) => {
  const cat = category || (await seedCategory());
  const br = brand || (await seedBrand());
  skuCounter += 1;
  const slug = `seeded-whey-${skuCounter}-${Date.now()}`;
  const product = await Product.create({
    name,
    slug,
    description: "Premium imported whey protein.",
    shortDescription: "Premium whey.",
    category: cat._id,
    categories: [cat._id],
    brand: br._id,
    status: "published",
    minPrice: variantOverrides.salePrice ?? 4999,
    maxPrice: variantOverrides.salePrice ?? 4999,
    totalStock: variantOverrides.stock ?? 25,
    ...productOverrides,
  });
  const variant = await Variant.create({
    product: product._id,
    sku: `SKU-${skuCounter}-${Date.now()}`,
    size: "2lb",
    originalPrice: 6500,
    salePrice: 4999,
    stock: 25,
    isActive: true,
    ...variantOverrides,
  });
  return { product, variant, category: cat, brand: br };
};

// Saves an address for a given user. Required for the registered-customer
// branch of order placement.
export const seedAddress = async (user, overrides = {}) =>
  Address.create({
    userId: user._id,
    label: "Home",
    addressLine1: "House 1, Street 2",
    addressLine2: "",
    city: "Lahore",
    state: "Punjab",
    postalCode: "54000",
    country: "Pakistan",
    isDefault: true,
    ...overrides,
  });

// Seeds a delivered order — exactly what review eligibility checks for.
// Bypasses the order.service's stock decrement (the test already controls
// stock directly via seedPublishedProduct).
export const seedDeliveredOrder = async ({ user, product, variant, address }) =>
  Order.create({
    user: user._id,
    items: [
      {
        product: product._id,
        sku: variant.sku,
        name: product.name,
        price: variant.salePrice,
        quantity: 1,
        subtotal: variant.salePrice,
      },
    ],
    shippingAddress: address._id,
    paymentMethod: "COD",
    subtotal: variant.salePrice,
    shippingFee: 0,
    totalAmount: variant.salePrice,
    status: "delivered",
  });
