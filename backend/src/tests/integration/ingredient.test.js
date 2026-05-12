import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { Ingredient } from "../../modules/ingredients/ingredient.model.js";
import {
  seedAdminAuth,
  seedAdminUser,
  signTokenFor,
} from "../helpers/fixtures.js";

const seedIngredient = async (authHeader, overrides = {}) => {
  const res = await request(app)
    .post("/api/v1/ingredients")
    .set(authHeader)
    .send({
      name: "Vitamin C",
      description: "Boosts immunity.",
      ...overrides,
    });
  return res.body.data;
};

describe("GET /api/v1/ingredients", () => {
  it("lists ingredients for anonymous visitors", async () => {
    const { authHeader } = await seedAdminAuth();
    await seedIngredient(authHeader, { name: "Magnesium" });
    await seedIngredient(authHeader, { name: "Omega-3" });

    const res = await request(app).get("/api/v1/ingredients");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it("emits no-store cache header for admin-context requests", async () => {
    const { authHeader } = await seedAdminAuth();
    const res = await request(app)
      .get("/api/v1/ingredients?active=all")
      .set(authHeader);
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toMatch(/no-store/i);
  });
});

describe("POST /api/v1/ingredients", () => {
  it("creates an ingredient with auto-generated slug", async () => {
    const { authHeader } = await seedAdminAuth();
    const res = await request(app)
      .post("/api/v1/ingredients")
      .set(authHeader)
      .send({ name: "Ashwagandha", description: "Adaptogen." });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Ashwagandha");
    expect(res.body.data.slug).toMatch(/ashwagandha/);
  });

  it("rejects unauthenticated calls", async () => {
    const res = await request(app)
      .post("/api/v1/ingredients")
      .send({ name: "Anon Ingredient" });
    expect(res.status).toBe(401);
  });

  it("rejects non-admin roles with 403", async () => {
    const user = await seedAdminUser({
      role: "User",
      email: "ing-user@stylogist.test",
      phone: "03001110005",
    });
    const token = signTokenFor(user);
    const res = await request(app)
      .post("/api/v1/ingredients")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Should Not Save" });
    expect(res.status).toBe(403);
  });
});

describe("GET /api/v1/ingredients/:slug", () => {
  it("returns the ingredient by slug", async () => {
    const { authHeader } = await seedAdminAuth();
    const created = await seedIngredient(authHeader, { name: "Curcumin" });
    const res = await request(app).get(`/api/v1/ingredients/${created.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Curcumin");
  });
});

describe("PATCH /api/v1/ingredients/:id", () => {
  it("updates the ingredient name and regenerates the slug", async () => {
    const { authHeader } = await seedAdminAuth();
    const created = await seedIngredient(authHeader, { name: "Old Name Ing" });

    const res = await request(app)
      .patch(`/api/v1/ingredients/${created._id}`)
      .set(authHeader)
      .send({ name: "New Name Ing" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("New Name Ing");
    expect(res.body.data.slug).toMatch(/new-name-ing/);
  });
});

describe("DELETE /api/v1/ingredients/:id", () => {
  it("removes the ingredient", async () => {
    const { authHeader } = await seedAdminAuth();
    const created = await seedIngredient(authHeader, { name: "Deletable Ing" });

    const res = await request(app)
      .delete(`/api/v1/ingredients/${created._id}`)
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(await Ingredient.findById(created._id)).toBeNull();
  });
});
