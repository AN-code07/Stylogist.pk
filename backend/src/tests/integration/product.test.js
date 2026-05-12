import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { Product } from "../../modules/products/product.model.js";
import { SeoRedirect } from "../../modules/seo/redirect.model.js";
import {
  seedAdminAuth,
  seedAdminUser,
  signTokenFor,
  seedCategory,
  seedBrand,
  buildProductPayload,
} from "../helpers/fixtures.js";

// Integration tests cover the public-facing contract of the products API:
// list, create, read-by-slug, update, delete, draft auto-save, and the
// 301 redirect that fires when an admin renames a slug. We hit the real
// Express app via supertest (no port boot) and the real Mongoose layer
// via mongodb-memory-server. No mocks — what passes here passes in prod.

describe("GET /api/v1/products", () => {
  it("returns published products to anonymous visitors", async () => {
    const category = await seedCategory();
    const brand = await seedBrand();
    const { authHeader } = await seedAdminAuth();

    await request(app)
      .post("/api/v1/products")
      .set(authHeader)
      .send(buildProductPayload({ category, brand, name: "Visible Pub" }));

    const res = await request(app).get("/api/v1/products");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((p) => p.name === "Visible Pub")).toBe(true);
  });

  it("hides draft products from anonymous visitors", async () => {
    const category = await seedCategory();
    const brand = await seedBrand();
    const { authHeader } = await seedAdminAuth();

    // Draft auto-save endpoint forces status='draft' regardless of body.
    await request(app)
      .post("/api/v1/products/draft")
      .set(authHeader)
      .send({ name: "Hidden Draft" });

    const res = await request(app).get("/api/v1/products");
    expect(res.status).toBe(200);
    expect(res.body.data.some((p) => p.name === "Hidden Draft")).toBe(false);
  });

  it("returns drafts when admin requests status=all", async () => {
    const { authHeader } = await seedAdminAuth();

    await request(app)
      .post("/api/v1/products/draft")
      .set(authHeader)
      .send({ name: "Admin-Visible Draft" });

    const res = await request(app)
      .get("/api/v1/products?status=all&limit=100")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.some((p) => p.name === "Admin-Visible Draft")).toBe(true);
  });

  it("emits a no-store Cache-Control header for admin context", async () => {
    const { authHeader } = await seedAdminAuth();
    const res = await request(app)
      .get("/api/v1/products?status=all")
      .set(authHeader);
    // Admin requests must never be served from the browser's HTTP cache
    // (see product.controller.cacheHeaderFor). This guard prevents the
    // regression where stale list payloads survived a CRUD operation.
    expect(res.headers["cache-control"]).toMatch(/no-store/i);
  });

  it("emits the public Cache-Control header for anonymous traffic", async () => {
    const res = await request(app).get("/api/v1/products");
    expect(res.headers["cache-control"]).toMatch(/public/i);
    expect(res.headers["cache-control"]).toMatch(/max-age/i);
  });
});

describe("POST /api/v1/products", () => {
  it("creates a product when called with a Super Admin token", async () => {
    const category = await seedCategory();
    const brand = await seedBrand();
    const { authHeader } = await seedAdminAuth();

    const res = await request(app)
      .post("/api/v1/products")
      .set(authHeader)
      .send(buildProductPayload({ category, brand }));

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Product created");
    expect(res.body.data.product.name).toBe("Test Whey Protein 2lb");
    expect(res.body.data.variants).toHaveLength(1);
    expect(res.body.data.variants[0].salePrice).toBe(4999);
  });

  it("persists the new content shapes: tax, banner-image benefits, simplified whyLoveIt, ingredientHighlight", async () => {
    const category = await seedCategory();
    const brand = await seedBrand();
    const { authHeader } = await seedAdminAuth();

    const res = await request(app)
      .post("/api/v1/products")
      .set(authHeader)
      .send(
        buildProductPayload({
          category,
          brand,
          // Tax percent — 17% (Pakistan GST baseline).
          taxPercent: 17,
          // Mixed input: a {text, image} object AND a plain legacy string.
          // The service normalizer coerces both to {text, image}.
          benefits: [
            { text: "Better sleep", image: "https://cdn.example.com/b1.jpg" },
            "Improved focus",
          ],
          uses: [
            { text: "Take 1 capsule before bed", image: "" },
          ],
          // WhyLoveIt is now title-only. Any legacy icon/body fields the
          // client sends are dropped by the normalizer.
          whyLoveIt: [
            { title: "Doctor recommended", icon: "ignored", body: "ignored" },
            { title: "Lab tested" },
          ],
          ingredientHighlight: {
            text: "<p>Powered by KSM-66 Ashwagandha</p>",
            image: "https://cdn.example.com/hero.jpg",
          },
        })
      );

    expect(res.status).toBe(201);
    const saved = res.body.data.product;
    expect(saved.taxPercent).toBe(17);
    expect(saved.benefits).toHaveLength(2);
    expect(saved.benefits[0]).toMatchObject({
      text: "Better sleep",
      image: "https://cdn.example.com/b1.jpg",
    });
    // Legacy string was coerced to {text, image:""}.
    expect(saved.benefits[1]).toMatchObject({ text: "Improved focus", image: "" });
    expect(saved.uses).toHaveLength(1);
    expect(saved.whyLoveIt).toEqual([{ title: "Doctor recommended" }, { title: "Lab tested" }]);
    expect(saved.ingredientHighlight.text).toContain("KSM-66");
    expect(saved.ingredientHighlight.image).toBe("https://cdn.example.com/hero.jpg");
  });

  it("rejects an unauthenticated create with 401", async () => {
    const category = await seedCategory();
    const brand = await seedBrand();
    const res = await request(app)
      .post("/api/v1/products")
      .send(buildProductPayload({ category, brand }));
    expect(res.status).toBe(401);
  });

  it("rejects a customer-role create with 403", async () => {
    const category = await seedCategory();
    const brand = await seedBrand();
    // Seed an admin user but downgrade their role — easiest way to get
    // a valid JWT for a non-admin user without standing up the full
    // login flow.
    const user = await seedAdminUser({ role: "User", email: "user@stylogist.test", phone: "03001112222" });
    const token = signTokenFor(user);

    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .send(buildProductPayload({ category, brand }));
    expect(res.status).toBe(403);
  });

  it("rejects invalid payloads with 400 (missing required fields)", async () => {
    const { authHeader } = await seedAdminAuth();
    const res = await request(app)
      .post("/api/v1/products")
      .set(authHeader)
      .send({ name: "X" }); // missing description, category, variants

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/products/draft", () => {
  it("persists a draft with only a name", async () => {
    const { authHeader } = await seedAdminAuth();
    const res = await request(app)
      .post("/api/v1/products/draft")
      .set(authHeader)
      .send({ name: "Bare Minimum Draft" });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Draft saved");
    expect(res.body.data.product.status).toBe("draft");

    const saved = await Product.findById(res.body.data.product._id);
    expect(saved).toBeTruthy();
    expect(saved.status).toBe("draft");
  });

  it("auto-generates a unique slug when none is provided", async () => {
    const { authHeader } = await seedAdminAuth();
    const a = await request(app)
      .post("/api/v1/products/draft")
      .set(authHeader)
      .send({ name: "Slugless Product" });
    const b = await request(app)
      .post("/api/v1/products/draft")
      .set(authHeader)
      .send({ name: "Slugless Product" });

    expect(a.body.data.product.slug).not.toBe(b.body.data.product.slug);
  });
});

describe("GET /api/v1/products/:slug", () => {
  it("returns a published product to anonymous visitors", async () => {
    const category = await seedCategory();
    const brand = await seedBrand();
    const { authHeader } = await seedAdminAuth();
    const created = await request(app)
      .post("/api/v1/products")
      .set(authHeader)
      .send(buildProductPayload({ category, brand, name: "Single-Slug Whey" }));

    const slug = created.body.data.product.slug;
    const res = await request(app).get(`/api/v1/products/${slug}`);

    expect(res.status).toBe(200);
    expect(res.body.data.product.name).toBe("Single-Slug Whey");
    expect(res.body.data.variants).toHaveLength(1);
  });

  it("returns a redirect envelope when the slug has been renamed", async () => {
    const category = await seedCategory();
    const brand = await seedBrand();
    const { authHeader } = await seedAdminAuth();
    const created = await request(app)
      .post("/api/v1/products")
      .set(authHeader)
      .send(buildProductPayload({ category, brand, slug: "old-slug" }));

    await request(app)
      .patch(`/api/v1/products/${created.body.data.product._id}`)
      .set(authHeader)
      .send({ slug: "new-slug" });

    const res = await request(app).get("/api/v1/products/old-slug");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("redirect");
    expect(res.body.redirect).toBe("/product/new-slug");

    // Redirect row should also be persisted for the prerender path.
    const redirect = await SeoRedirect.findOne({ fromPath: "/product/old-slug" });
    expect(redirect).toBeTruthy();
    expect(redirect.toPath).toBe("/product/new-slug");
  });

  it("returns 404 for an unknown slug", async () => {
    const res = await request(app).get("/api/v1/products/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/v1/products/:id", () => {
  it("updates a product and re-aggregates pricing from new variants", async () => {
    const category = await seedCategory();
    const brand = await seedBrand();
    const { authHeader } = await seedAdminAuth();
    const created = await request(app)
      .post("/api/v1/products")
      .set(authHeader)
      .send(buildProductPayload({ category, brand }));

    const id = created.body.data.product._id;
    const res = await request(app)
      .patch(`/api/v1/products/${id}`)
      .set(authHeader)
      .send({
        name: "Renamed Whey",
        variants: [
          { sku: "WHEY-NEW", size: "5lb", originalPrice: 12000, salePrice: 8999, stock: 10 },
          { sku: "WHEY-NEW-2", size: "2lb", originalPrice: 6000, salePrice: 4999, stock: 15 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.product.name).toBe("Renamed Whey");
    expect(res.body.data.product.minPrice).toBe(4999);
    expect(res.body.data.product.maxPrice).toBe(8999);
    expect(res.body.data.product.totalStock).toBe(25);
  });

  it("rejects updates from non-admin users", async () => {
    const category = await seedCategory();
    const brand = await seedBrand();
    const { authHeader } = await seedAdminAuth();
    const created = await request(app)
      .post("/api/v1/products")
      .set(authHeader)
      .send(buildProductPayload({ category, brand }));

    const user = await seedAdminUser({ role: "User", email: "guest@stylogist.test", phone: "03001113333" });
    const token = signTokenFor(user);

    const res = await request(app)
      .patch(`/api/v1/products/${created.body.data.product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Hijacked" });
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/v1/products/:id", () => {
  it("removes the product so the next list query no longer returns it", async () => {
    const category = await seedCategory();
    const brand = await seedBrand();
    const { authHeader } = await seedAdminAuth();
    const created = await request(app)
      .post("/api/v1/products")
      .set(authHeader)
      .send(buildProductPayload({ category, brand, name: "To Be Deleted" }));

    const id = created.body.data.product._id;
    const del = await request(app).delete(`/api/v1/products/${id}`).set(authHeader);
    expect(del.status).toBe(200);

    const after = await request(app).get("/api/v1/products");
    expect(after.body.data.some((p) => p._id === id)).toBe(false);

    // Verifies the cache-busting fix end-to-end: even a brand-new GET
    // doesn't see the deleted product, which means the server is the
    // source of truth (no stale cache layer in play).
    const inDb = await Product.findById(id);
    expect(inDb).toBeNull();
  });
});
