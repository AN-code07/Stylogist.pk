import { describe, it, expect, beforeEach } from "vitest";
import useWishlistStore from "./useWishlistStore.js";

beforeEach(() => {
  useWishlistStore.setState({ items: [] });
});

const item = (overrides = {}) => ({
  productId: "p1",
  slug: "whey",
  name: "Whey",
  image: "/uploads/whey.jpg",
  price: 4999,
  ...overrides,
});

describe("useWishlistStore.add", () => {
  it("adds a product to the wishlist", () => {
    useWishlistStore.getState().add(item());
    expect(useWishlistStore.getState().items).toHaveLength(1);
  });

  it("ignores duplicate productIds", () => {
    useWishlistStore.getState().add(item());
    useWishlistStore.getState().add(item());
    expect(useWishlistStore.getState().items).toHaveLength(1);
  });
});

describe("useWishlistStore.toggle", () => {
  it("returns true and adds when the product was absent", () => {
    const saved = useWishlistStore.getState().toggle(item());
    expect(saved).toBe(true);
    expect(useWishlistStore.getState().items).toHaveLength(1);
  });

  it("returns false and removes when the product was already saved", () => {
    useWishlistStore.getState().add(item());
    const saved = useWishlistStore.getState().toggle(item());
    expect(saved).toBe(false);
    expect(useWishlistStore.getState().items).toHaveLength(0);
  });
});

describe("useWishlistStore.has + count + clear", () => {
  it("has() reports membership", () => {
    useWishlistStore.getState().add(item());
    expect(useWishlistStore.getState().has("p1")).toBe(true);
    expect(useWishlistStore.getState().has("p999")).toBe(false);
  });

  it("count() returns the number of items", () => {
    useWishlistStore.getState().add(item());
    useWishlistStore.getState().add(item({ productId: "p2" }));
    expect(useWishlistStore.getState().count()).toBe(2);
  });

  it("clear() empties the list", () => {
    useWishlistStore.getState().add(item());
    useWishlistStore.getState().clear();
    expect(useWishlistStore.getState().items).toHaveLength(0);
  });
});
