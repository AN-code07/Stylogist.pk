import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { SiteSettings } from "../../modules/settings/settings.model.js";
import { seedAdminAuth, seedAdminUser, signTokenFor } from "../helpers/fixtures.js";

describe("GET /api/v1/settings", () => {
  it("returns default footer + about content when no document exists yet", async () => {
    const res = await request(app).get("/api/v1/settings");
    expect(res.status).toBe(200);
    expect(res.body.data.footer.brandTagline).toBeTruthy();
    expect(res.body.data.footer.shopLinks.length).toBeGreaterThan(0);
    expect(res.body.data.about.visionHeading).toBeTruthy();
  });

  it("surfaces stored values when present", async () => {
    await SiteSettings.create({
      key: "site",
      footer: {
        brandTagline: "Custom tagline copy",
        phone: "+92 333 0000000",
      },
    });

    const res = await request(app).get("/api/v1/settings");
    expect(res.status).toBe(200);
    expect(res.body.data.footer.brandTagline).toBe("Custom tagline copy");
    expect(res.body.data.footer.phone).toBe("+92 333 0000000");
  });
});

describe("PATCH /api/v1/settings", () => {
  it("upserts footer fields when called with admin auth", async () => {
    const { authHeader } = await seedAdminAuth();

    const res = await request(app)
      .patch("/api/v1/settings")
      .set(authHeader)
      .send({
        footer: { brandTagline: "Updated tagline", phone: "+92 300 1112233" },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.footer.brandTagline).toBe("Updated tagline");

    const persisted = await SiteSettings.findOne({ key: "site" });
    expect(persisted.footer.brandTagline).toBe("Updated tagline");
    expect(persisted.footer.phone).toBe("+92 300 1112233");
  });

  it("preserves untouched fields on partial updates", async () => {
    const { authHeader } = await seedAdminAuth();

    // First write: brandTagline + phone.
    await request(app)
      .patch("/api/v1/settings")
      .set(authHeader)
      .send({ footer: { brandTagline: "First", phone: "+92 300 0000001" } });

    // Second write: only address — phone must NOT be wiped.
    await request(app)
      .patch("/api/v1/settings")
      .set(authHeader)
      .send({ footer: { address: "Stylogist HQ" } });

    const reread = await SiteSettings.findOne({ key: "site" });
    expect(reread.footer.address).toBe("Stylogist HQ");
    expect(reread.footer.phone).toBe("+92 300 0000001");
  });

  it("rejects unauthenticated PATCH calls", async () => {
    const res = await request(app)
      .patch("/api/v1/settings")
      .send({ footer: { brandTagline: "Sneaky" } });
    expect(res.status).toBe(401);
  });

  it("rejects customer-role PATCH calls with 403", async () => {
    const user = await seedAdminUser({
      role: "User",
      email: "settings-user@stylogist.test",
      phone: "03001110003",
    });
    const token = signTokenFor(user);
    const res = await request(app)
      .patch("/api/v1/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({ footer: { brandTagline: "Hijack" } });
    expect(res.status).toBe(403);
  });
});
