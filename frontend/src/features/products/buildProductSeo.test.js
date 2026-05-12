import { describe, it, expect } from "vitest";
import {
  buildProductTitle,
  buildProductDescription,
  buildProductImageAlt,
} from "./buildProductSeo.js";

describe("buildProductTitle", () => {
  it("returns the site name when product is missing", () => {
    expect(buildProductTitle(null)).toBe("Stylogist");
    expect(buildProductTitle({})).toBe("Stylogist");
  });

  it("passes admin-supplied metaTitle through VERBATIM (no clamping)", () => {
    // 200-char string — well over Google's ~65-char SERP budget. The
    // helper used to truncate, but the policy is now display-only.
    const longTitle = "A".repeat(200);
    const product = { name: "X", metaTitle: longTitle };
    expect(buildProductTitle(product)).toBe(longTitle);
  });

  it("falls back to keyword-shaped title when meta is empty", () => {
    const product = { name: "Whey 2lb", category: { name: "Protein" } };
    const title = buildProductTitle(product);
    expect(title).toMatch(/Whey 2lb/);
    expect(title).toMatch(/Pakistan/);
  });

  it("uses 'Supplement' as the category fallback when none is set", () => {
    const product = { name: "Generic Item" };
    expect(buildProductTitle(product)).toMatch(/Supplement/);
  });

  it("ignores admin meta when respectAdmin is explicitly false", () => {
    const product = {
      name: "Whey",
      metaTitle: "Admin Title",
      category: { name: "Protein" },
    };
    const title = buildProductTitle(product, { respectAdmin: false });
    expect(title).not.toBe("Admin Title");
    expect(title).toMatch(/Whey/);
  });
});

describe("buildProductDescription", () => {
  it("returns empty string for missing product", () => {
    expect(buildProductDescription(null)).toBe("");
  });

  it("passes admin-supplied metaDescription through VERBATIM", () => {
    const longDesc = "B".repeat(500);
    const product = { name: "X", metaDescription: longDesc };
    expect(buildProductDescription(product)).toBe(longDesc);
  });

  it("strips HTML from shortDescription when used as fallback lead", () => {
    const product = {
      name: "Whey",
      shortDescription: "<p>Pure <strong>whey</strong> isolate</p>",
      category: { name: "Protein" },
    };
    const desc = buildProductDescription(product);
    expect(desc).not.toContain("<");
    expect(desc).toContain("Pure whey isolate");
  });

  it("includes the country + delivery trail in fallback copy", () => {
    const product = { name: "Whey", description: "Premium." };
    expect(buildProductDescription(product)).toMatch(/Pakistan/);
    expect(buildProductDescription(product)).toMatch(/delivery/i);
  });
});

describe("buildProductImageAlt", () => {
  it("returns an empty string when product is missing", () => {
    expect(buildProductImageAlt(null)).toBe("");
  });

  it("composes name + brand + form + country", () => {
    const alt = buildProductImageAlt({
      name: "Whey 2lb",
      brand: { name: "ON" },
      itemDetails: { itemForm: "Powder" },
    });
    expect(alt).toContain("Whey 2lb");
    expect(alt).toContain("ON");
    expect(alt).toContain("Powder");
    expect(alt).toContain("Pakistan");
  });

  it("appends an image index suffix when index > 0", () => {
    const alt = buildProductImageAlt({ name: "Whey" }, 2);
    expect(alt).toMatch(/\(image 3\)/);
  });
});
