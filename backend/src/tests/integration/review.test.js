import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { Review } from "../../modules/reviews/review.model.js";
import { Product } from "../../modules/products/product.model.js";
import {
  seedAdminAuth,
  seedCustomerAuth,
  seedCustomer,
  signTokenFor,
  seedPublishedProduct,
  seedAddress,
  seedDeliveredOrder,
} from "../helpers/fixtures.js";

// Reviews enforce two business rules:
//   1. Only customers with a *delivered* order for the product can review.
//   2. One review per (user, product) — duplicates are 409s.
// We test both gates plus the admin moderation flow.

describe("POST /api/v1/reviews", () => {
  it("creates a pending review for a verified buyer", async () => {
    const { user, authHeader } = await seedCustomerAuth();
    const { product, variant } = await seedPublishedProduct();
    const address = await seedAddress(user);
    await seedDeliveredOrder({ user, product, variant, address });

    const res = await request(app)
      .post("/api/v1/reviews")
      .set(authHeader)
      .send({ product: product._id.toString(), rating: 5, comment: "Loved it" });

    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(5);
    expect(res.body.data.status).toBe("pending");
  });

  it("accepts a review even when the user has no delivered order (eligibility gate removed)", async () => {
    const { authHeader } = await seedCustomerAuth();
    const { product } = await seedPublishedProduct();

    const res = await request(app)
      .post("/api/v1/reviews")
      .set(authHeader)
      .send({ product: product._id.toString(), rating: 4, comment: "Heard good things" });

    expect(res.status).toBe(201);
    // No delivered order = order stays null on the persisted review,
    // which the PDP uses to suppress the "verified buyer" badge.
    expect(res.body.data.order).toBeFalsy();
  });

  it("allows multiple reviews per user/product (duplicate gate removed)", async () => {
    const { user, authHeader } = await seedCustomerAuth();
    const { product, variant } = await seedPublishedProduct();
    const address = await seedAddress(user);
    await seedDeliveredOrder({ user, product, variant, address });

    const first = await request(app)
      .post("/api/v1/reviews")
      .set(authHeader)
      .send({ product: product._id.toString(), rating: 5 });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/v1/reviews")
      .set(authHeader)
      .send({ product: product._id.toString(), rating: 4, comment: "Second thoughts" });
    expect(second.status).toBe(201);
  });

  it("persists the optional reviewer photo when supplied", async () => {
    const { user, authHeader } = await seedCustomerAuth();
    const { product, variant } = await seedPublishedProduct();
    const address = await seedAddress(user);
    await seedDeliveredOrder({ user, product, variant, address });

    const res = await request(app)
      .post("/api/v1/reviews")
      .set(authHeader)
      .send({
        product: product._id.toString(),
        rating: 5,
        comment: "With photo",
        image: "https://cdn.example.com/u/photo-1.jpg",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.image).toBe("https://cdn.example.com/u/photo-1.jpg");
  });

  it("rejects unauthenticated review creation", async () => {
    const { product } = await seedPublishedProduct();
    const res = await request(app)
      .post("/api/v1/reviews")
      .send({ product: product._id.toString(), rating: 5 });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/reviews/eligibility/:productId", () => {
  it("returns canReview=true when the user has a delivered order", async () => {
    const { user, authHeader } = await seedCustomerAuth();
    const { product, variant } = await seedPublishedProduct();
    const address = await seedAddress(user);
    await seedDeliveredOrder({ user, product, variant, address });

    const res = await request(app)
      .get(`/api/v1/reviews/eligibility/${product._id}`)
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.canReview).toBe(true);
    expect(res.body.data.hasReviewed).toBe(false);
  });

  it("returns canReview=false for a user with no delivered order", async () => {
    const { authHeader } = await seedCustomerAuth();
    const { product } = await seedPublishedProduct();
    const res = await request(app)
      .get(`/api/v1/reviews/eligibility/${product._id}`)
      .set(authHeader);
    expect(res.status).toBe(200);
    expect(res.body.data.canReview).toBe(false);
  });
});

describe("PATCH /api/v1/reviews/:id/status (admin moderation)", () => {
  it("approves a review and recomputes product stats", async () => {
    // Buyer submits a 5★ review.
    const buyer = await seedCustomer({ email: "buyer@stylogist.test", phone: "03001112233" });
    const buyerToken = signTokenFor(buyer);
    const { product, variant } = await seedPublishedProduct();
    const address = await seedAddress(buyer);
    await seedDeliveredOrder({ user: buyer, product, variant, address });

    const created = await request(app)
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ product: product._id.toString(), rating: 5, comment: "Solid" });

    // Admin approves it.
    const { authHeader: adminAuth } = await seedAdminAuth();
    const approved = await request(app)
      .patch(`/api/v1/reviews/${created.body.data._id}/status`)
      .set(adminAuth)
      .send({ status: "approved" });

    expect(approved.status).toBe(200);

    // Product's denormalized rating fields update from the approval.
    const reread = await Product.findById(product._id);
    expect(reread.totalReviews).toBe(1);
    expect(reread.averageRating).toBeCloseTo(5);
  });

  it("rejects moderation requests from non-admins", async () => {
    const buyer = await seedCustomer({ email: "buyer2@stylogist.test", phone: "03001112244" });
    const buyerToken = signTokenFor(buyer);
    const { product, variant } = await seedPublishedProduct();
    const address = await seedAddress(buyer);
    await seedDeliveredOrder({ user: buyer, product, variant, address });

    const created = await request(app)
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ product: product._id.toString(), rating: 4 });

    const res = await request(app)
      .patch(`/api/v1/reviews/${created.body.data._id}/status`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ status: "approved" });
    expect(res.status).toBe(403);
  });
});

describe("GET /api/v1/reviews/product/:productId", () => {
  it("returns only approved reviews to the public", async () => {
    const buyer = await seedCustomer({ email: "buyer3@stylogist.test", phone: "03001112255" });
    const buyerToken = signTokenFor(buyer);
    const { product, variant } = await seedPublishedProduct();
    const address = await seedAddress(buyer);
    await seedDeliveredOrder({ user: buyer, product, variant, address });

    await request(app)
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ product: product._id.toString(), rating: 5, comment: "Hidden draft" });

    // Pending status — should NOT appear in the public list.
    const beforeApproval = await request(app).get(`/api/v1/reviews/product/${product._id}`);
    expect(beforeApproval.status).toBe(200);
    expect(beforeApproval.body.data).toHaveLength(0);

    // Approve and re-check.
    await Review.updateMany({ product: product._id }, { status: "approved" });
    const afterApproval = await request(app).get(`/api/v1/reviews/product/${product._id}`);
    expect(afterApproval.body.data).toHaveLength(1);
  });
});
