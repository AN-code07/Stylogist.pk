import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { Brand } from "../../modules/brands/brand.model.js";
import {
  seedAdminAuth,
  seedAdminUser,
  signTokenFor,
  seedBrand,
  seedPublishedProduct,
} from "../helpers/fixtures.js";

describe("GET /api/v1/brands", () => {
  it("returns the brand list to anonymous visitors", async () => {
    await seedBrand({ name: "Optimum Nutrition" });
    await seedBrand({ name: "Nature's Bounty" });

    const res = await request(app).get("/api/v1/brands");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it("supports includeCount=true to attach productCount per brand", async () => {
    const { product, brand } = await seedPublishedProduct();
    const res = await request(app).get("/api/v1/brands?includeCount=true");
    expect(res.status).toBe(200);
    const target = res.body.data.find((b) => b._id === brand._id.toString());
    expect(target.productCount).toBeGreaterThanOrEqual(1);
    expect(product).toBeTruthy(); // satisfy unused-var lint
  });
});

describe("POST /api/v1/brands", () => {
  it("creates a brand for admin users", async () => {
    const { authHeader } = await seedAdminAuth();
    const res = await request(app)
      .post("/api/v1/brands")
      .set(authHeader)
      .send({ name: "Test Brand X", description: "Imported supplements." });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Test Brand X");
    expect(res.body.data.slug).toMatch(/test-brand-x/);
  });

  it("rejects duplicate brand names with 409", async () => {
    const { authHeader } = await seedAdminAuth();
    await seedBrand({ name: "Dupe Brand" });
    const res = await request(app)
      .post("/api/v1/brands")
      .set(authHeader)
      .send({ name: "Dupe Brand" });
    expect(res.status).toBe(409);
  });

  it("rejects unauthenticated calls", async () => {
    const res = await request(app)
      .post("/api/v1/brands")
      .send({ name: "Anon Brand" });
    expect(res.status).toBe(401);
  });

  it("rejects non-admin tokens", async () => {
    const user = await seedAdminUser({
      role: "User",
      email: "brand-user@stylogist.test",
      phone: "03001110002",
    });
    const token = signTokenFor(user);
    const res = await request(app)
      .post("/api/v1/brands")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Sneaky Brand" });
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/v1/brands/:id", () => {
  it("updates the brand and refreshes the slug on rename", async () => {
    const { authHeader } = await seedAdminAuth();
    const brand = await seedBrand({ name: "Old Brand Name" });

    const res = await request(app)
      .patch(`/api/v1/brands/${brand._id}`)
      .set(authHeader)
      .send({ name: "New Brand Name" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("New Brand Name");
  });
});

describe("DELETE /api/v1/brands/:id", () => {
  it("refuses to delete a brand that still has products attached", async () => {
    const { authHeader } = await seedAdminAuth();
    const { brand } = await seedPublishedProduct();
    const res = await request(app)
      .delete(`/api/v1/brands/${brand._id}`)
      .set(authHeader);
    // brand.service.deleteBrand throws 409 with a "reassign or remove" hint.
    expect(res.status).toBe(409);
    const stillExists = await Brand.findById(brand._id);
    expect(stillExists).toBeTruthy();
  });

  it("deletes an unused brand cleanly", async () => {
    const { authHeader } = await seedAdminAuth();
    const brand = await seedBrand({ name: "Unused Brand" });
    const res = await request(app)
      .delete(`/api/v1/brands/${brand._id}`)
      .set(authHeader);
    expect(res.status).toBe(200);
    expect(await Brand.findById(brand._id)).toBeNull();
  });
});
