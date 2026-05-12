import { describe, it, expect } from "vitest";
import {
  aggregateFromVariants,
  normalizeVariant,
} from "../../modules/products/product.service.js";

// Pure-function unit tests. Fast (no DB, no HTTP), so we can afford
// exhaustive edge-case coverage here.

describe("aggregateFromVariants", () => {
  it("returns zeros for empty / nullish input", () => {
    expect(aggregateFromVariants([])).toEqual({
      minPrice: 0,
      maxPrice: 0,
      totalStock: 0,
      discountPercentage: 0,
    });
    expect(aggregateFromVariants(undefined)).toEqual({
      minPrice: 0,
      maxPrice: 0,
      totalStock: 0,
      discountPercentage: 0,
    });
  });

  it("derives min/max price across variants", () => {
    const result = aggregateFromVariants([
      { salePrice: 4999, stock: 5 },
      { salePrice: 8999, stock: 3 },
      { salePrice: 5999, stock: 7 },
    ]);
    expect(result.minPrice).toBe(4999);
    expect(result.maxPrice).toBe(8999);
  });

  it("sums stock across variants", () => {
    const result = aggregateFromVariants([
      { salePrice: 100, stock: 10 },
      { salePrice: 200, stock: 20 },
      { salePrice: 300, stock: 5 },
    ]);
    expect(result.totalStock).toBe(35);
  });

  it("treats missing stock as zero", () => {
    const result = aggregateFromVariants([
      { salePrice: 100 }, // no stock
      { salePrice: 200, stock: 12 },
    ]);
    expect(result.totalStock).toBe(12);
  });

  it("picks the highest discountPercentage seen", () => {
    const result = aggregateFromVariants([
      { salePrice: 100, discountPercentage: 10 },
      { salePrice: 200, discountPercentage: 30 },
      { salePrice: 300, discountPercentage: 15 },
    ]);
    expect(result.discountPercentage).toBe(30);
  });
});

describe("normalizeVariant", () => {
  it("defaults missing stock to 50", () => {
    const result = normalizeVariant({ salePrice: 100 });
    expect(result.stock).toBe(50);
  });

  it("respects an explicit zero stock value", () => {
    const result = normalizeVariant({ salePrice: 100, stock: 0 });
    expect(result.stock).toBe(0);
  });

  it("coerces stock to a number", () => {
    const result = normalizeVariant({ salePrice: 100, stock: "12" });
    expect(result.stock).toBe(12);
  });

  it("drops the retired ingredients/material text fields", () => {
    const result = normalizeVariant({
      salePrice: 100,
      stock: 1,
      ingredients: "should be dropped",
      material: "also dropped",
      potency: "1000mg",
    });
    expect(result).not.toHaveProperty("ingredients");
    expect(result).not.toHaveProperty("material");
    expect(result.potency).toBe("1000mg");
  });

  it("trims potency whitespace", () => {
    const result = normalizeVariant({ salePrice: 100, potency: "  500mg  " });
    expect(result.potency).toBe("500mg");
  });

  it("defaults potency to empty string when omitted", () => {
    const result = normalizeVariant({ salePrice: 100 });
    expect(result.potency).toBe("");
  });

  it("preserves remaining variant fields untouched", () => {
    const result = normalizeVariant({
      sku: "WHEY-2LB",
      size: "2lb",
      color: "Chocolate",
      salePrice: 4999,
      originalPrice: 5999,
      stock: 10,
    });
    expect(result.sku).toBe("WHEY-2LB");
    expect(result.size).toBe("2lb");
    expect(result.color).toBe("Chocolate");
    expect(result.salePrice).toBe(4999);
    expect(result.originalPrice).toBe(5999);
  });
});
