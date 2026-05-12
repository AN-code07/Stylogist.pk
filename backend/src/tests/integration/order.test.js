import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { Variant } from "../../modules/products/variant.model.js";
import { Product } from "../../modules/products/product.model.js";
import Order from "../../modules/orders/order.model.js";
import {
  seedAdminAuth,
  seedCustomerAuth,
  seedCustomer,
  signTokenFor,
  seedPublishedProduct,
  seedAddress,
  seedDeliveredOrder,
} from "../helpers/fixtures.js";

// Orders are the money path — every branch matters. We test both the
// registered-customer and guest branches, the stock-decrement transaction,
// and the user-scoping of GET /me.

describe("POST /api/v1/orders (registered customer)", () => {
  it("places an order and decrements variant stock", async () => {
    const { user, authHeader } = await seedCustomerAuth();
    const { product, variant } = await seedPublishedProduct({
      variantOverrides: { stock: 10, salePrice: 4999 },
    });
    const address = await seedAddress(user);

    const res = await request(app)
      .post("/api/v1/orders")
      .set(authHeader)
      .send({
        items: [{ productId: product._id.toString(), sku: variant.sku, quantity: 2 }],
        addressId: address._id.toString(),
        paymentMethod: "COD",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.totalAmount).toBe(9998); // 4999 * 2
    expect(res.body.data.user).toBeTruthy();
    expect(res.body.data.guest).toBeFalsy();

    // Stock was decremented inside a transaction.
    const reread = await Variant.findById(variant._id);
    expect(reread.stock).toBe(8);

    const reReadProduct = await Product.findById(product._id);
    expect(reReadProduct.totalSales).toBe(2);
  });

  it("rejects an order when the address belongs to a different user", async () => {
    const { authHeader } = await seedCustomerAuth();
    const otherUser = await seedCustomer({
      email: "other@stylogist.test",
      phone: "03007770000",
    });
    const otherAddress = await seedAddress(otherUser);
    const { product, variant } = await seedPublishedProduct();

    const res = await request(app)
      .post("/api/v1/orders")
      .set(authHeader)
      .send({
        items: [{ productId: product._id.toString(), sku: variant.sku, quantity: 1 }],
        addressId: otherAddress._id.toString(),
      });

    expect(res.status).toBe(404);
  });

  it("rejects an order when stock is insufficient", async () => {
    const { user, authHeader } = await seedCustomerAuth();
    const { product, variant } = await seedPublishedProduct({
      variantOverrides: { stock: 1 },
    });
    const address = await seedAddress(user);

    const res = await request(app)
      .post("/api/v1/orders")
      .set(authHeader)
      .send({
        items: [{ productId: product._id.toString(), sku: variant.sku, quantity: 5 }],
        addressId: address._id.toString(),
      });

    expect(res.status).toBe(400);

    // Stock must NOT have been decremented — the order service runs in a
    // transaction so a partial failure rolls everything back.
    const reread = await Variant.findById(variant._id);
    expect(reread.stock).toBe(1);
  });
});

describe("POST /api/v1/orders (guest checkout)", () => {
  it("accepts a guest order without an auth token", async () => {
    const { product, variant } = await seedPublishedProduct({
      variantOverrides: { stock: 5 },
    });

    const res = await request(app)
      .post("/api/v1/orders")
      .send({
        items: [{ productId: product._id.toString(), sku: variant.sku, quantity: 1 }],
        guest: { name: "Guest Buyer", email: "guest@stylogist.test", phone: "03001111111" },
        guestAddress: {
          label: "Home",
          addressLine1: "House 5, Street 2",
          city: "Karachi",
          state: "Sindh",
          postalCode: "75500",
          country: "Pakistan",
        },
        paymentMethod: "COD",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toBeNull();
    expect(res.body.data.guest.email).toBe("guest@stylogist.test");
    expect(res.body.data.guestAddress.city).toBe("Karachi");
    expect(res.body.data.shippingAddress).toBeNull();
  });

  it("rejects a guest order missing the inline customer info", async () => {
    const { product, variant } = await seedPublishedProduct();

    const res = await request(app)
      .post("/api/v1/orders")
      .send({
        items: [{ productId: product._id.toString(), sku: variant.sku, quantity: 1 }],
        paymentMethod: "COD",
        // no addressId AND no guest/guestAddress
      });

    // Zod-level refinement: must provide one branch or the other.
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/orders/me", () => {
  it("returns only the calling user's orders", async () => {
    const { user, authHeader } = await seedCustomerAuth();
    const otherUser = await seedCustomer({
      email: "other2@stylogist.test",
      phone: "03007770001",
    });
    const { product, variant } = await seedPublishedProduct();
    const address = await seedAddress(user);
    const otherAddress = await seedAddress(otherUser);

    await seedDeliveredOrder({ user, product, variant, address });
    await seedDeliveredOrder({ user: otherUser, product, variant, address: otherAddress });

    const res = await request(app).get("/api/v1/orders/me").set(authHeader);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    // user is auto-populated by the order schema's pre('find') hook
    expect(res.body.data[0].user._id || res.body.data[0].user).toBe(user._id.toString());
  });

  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/orders/me");
    expect(res.status).toBe(401);
  });
});
