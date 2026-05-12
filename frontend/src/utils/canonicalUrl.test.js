import { describe, it, expect, beforeEach } from "vitest";
import { buildCanonicalUrl } from "./canonicalUrl.js";

const ORIGIN = "http://localhost";

beforeEach(() => {
  // jsdom defaults to http://localhost — make it deterministic.
  Object.defineProperty(window, "location", {
    value: { origin: ORIGIN },
    writable: true,
  });
});

describe("buildCanonicalUrl", () => {
  it("returns origin + path when no params are present", () => {
    expect(buildCanonicalUrl("/category", new URLSearchParams())).toBe(`${ORIGIN}/category`);
  });

  it("keeps only canonical-partitioning params (category/brand/search/...)", () => {
    const sp = new URLSearchParams({
      category: "protein",
      page: "3", // pagination — must be dropped
      sort: "priceLow", // sort — must be dropped
    });
    expect(buildCanonicalUrl("/category", sp)).toBe(`${ORIGIN}/category?category=protein`);
  });

  it("drops default values (sort=newest, page=1)", () => {
    const sp = new URLSearchParams({ sort: "newest", page: "1", brand: "on" });
    expect(buildCanonicalUrl("/category", sp)).toBe(`${ORIGIN}/category?brand=on`);
  });

  it("alphabetizes params so different orderings collapse", () => {
    const a = buildCanonicalUrl(
      "/category",
      new URLSearchParams({ brand: "on", category: "protein" })
    );
    const b = buildCanonicalUrl(
      "/category",
      new URLSearchParams({ category: "protein", brand: "on" })
    );
    expect(a).toBe(b);
  });

  it("accepts a query string with or without leading '?'", () => {
    expect(buildCanonicalUrl("/x", "?category=a")).toBe(`${ORIGIN}/x?category=a`);
    expect(buildCanonicalUrl("/x", "category=a")).toBe(`${ORIGIN}/x?category=a`);
  });

  it("accepts a plain object", () => {
    expect(buildCanonicalUrl("/x", { search: "whey" })).toBe(`${ORIGIN}/x?search=whey`);
  });
});
