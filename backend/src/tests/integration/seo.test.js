import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { SeoRedirect } from "../../modules/seo/redirect.model.js";
import {
  seedAdminAuth,
  seedPublishedProduct,
} from "../helpers/fixtures.js";

describe("GET /sitemap.xml", () => {
  it("returns a valid XML sitemap with at least the static URLs", async () => {
    const res = await request(app).get("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/xml/i);
    expect(res.text).toMatch(/<\?xml/);
    expect(res.text).toMatch(/<urlset/);
    expect(res.text).toMatch(/<loc>.+<\/loc>/);
  });

  it("includes every published product URL", async () => {
    const { product } = await seedPublishedProduct({ name: "Sitemap Whey" });
    const res = await request(app).get("/sitemap.xml");
    expect(res.text).toContain(`/product/${product.slug}`);
  });

  it("sets a long public Cache-Control header", async () => {
    const res = await request(app).get("/sitemap.xml");
    expect(res.headers["cache-control"]).toMatch(/public/i);
    expect(res.headers["cache-control"]).toMatch(/max-age/i);
  });
});

describe("GET /robots.txt", () => {
  it("returns a robots policy that exposes the sitemap and blocks admin", async () => {
    const res = await request(app).get("/robots.txt");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/plain/);
    expect(res.text).toContain("User-agent: *");
    expect(res.text).toMatch(/Disallow:\s*\/admin/);
    expect(res.text).toMatch(/Sitemap:\s*http/);
  });
});

describe("GET /og/product/:slug.svg", () => {
  it("returns an SVG image with the product name embedded", async () => {
    const { product } = await seedPublishedProduct({ name: "Embedded Product Name" });
    const res = await request(app).get(`/og/product/${product.slug}.svg`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/image\/svg\+xml/);
    expect(res.text).toContain("Embedded Product Name");
  });

  it("returns 404 for an unknown slug", async () => {
    const res = await request(app).get("/og/product/does-not-exist.svg");
    expect(res.status).toBe(404);
  });
});

describe("GET /prerender/product/:slug", () => {
  it("returns an HTML shell with Product JSON-LD for crawlers", async () => {
    const { product } = await seedPublishedProduct({ name: "Prerender Whey" });
    const res = await request(app).get(`/prerender/product/${product.slug}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("Prerender Whey");
    expect(res.text).toContain('"@type":"Product"');
    expect(res.text).toContain('"@type":"BreadcrumbList"');
  });

  it("issues a real HTTP 301 when the slug has been renamed", async () => {
    const { product } = await seedPublishedProduct({ name: "Renamed Soon" });
    const { authHeader } = await seedAdminAuth();

    await request(app)
      .patch(`/api/v1/products/${product._id}`)
      .set(authHeader)
      .send({ slug: "renamed-target" });

    // supertest follows redirects by default — disable so we can assert
    // on the 301 itself.
    const res = await request(app)
      .get(`/prerender/product/${product.slug}`)
      .redirects(0);
    expect(res.status).toBe(301);
    expect(res.headers.location).toContain("/product/renamed-target");

    // Persisted SeoRedirect row too.
    const row = await SeoRedirect.findOne({ fromPath: `/product/${product.slug}` });
    expect(row).toBeTruthy();
  });
});
