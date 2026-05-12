import { describe, it, expect, beforeEach } from "vitest";
import useCartStore from "./useCartStore.js";

beforeEach(() => {
  // setup.js clears localStorage; also reset the in-memory store so
  // line items from the previous test don't bleed in.
  useCartStore.setState({ items: [] });
});

const item = (overrides = {}) => ({
  productId: "p1",
  sku: "WHEY-2LB",
  name: "Whey 2lb",
  price: 4999,
  quantity: 1,
  ...overrides,
});

describe("useCartStore.addItem", () => {
  it("adds a new line when productId+sku is unique", () => {
    useCartStore.getState().addItem(item());
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("increments quantity when the same productId+sku is added again", () => {
    useCartStore.getState().addItem(item({ quantity: 2 }));
    useCartStore.getState().addItem(item({ quantity: 3 }));
    const [line] = useCartStore.getState().items;
    expect(line.quantity).toBe(5);
  });

  it("treats different SKUs of the same product as separate lines", () => {
    useCartStore.getState().addItem(item({ sku: "WHEY-2LB" }));
    useCartStore.getState().addItem(item({ sku: "WHEY-5LB" }));
    expect(useCartStore.getState().items).toHaveLength(2);
  });
});

describe("useCartStore.setQuantity", () => {
  it("updates the matched line's quantity", () => {
    useCartStore.getState().addItem(item());
    useCartStore.getState().setQuantity("p1", "WHEY-2LB", 7);
    expect(useCartStore.getState().items[0].quantity).toBe(7);
  });

  it("clamps to at least 1", () => {
    useCartStore.getState().addItem(item());
    useCartStore.getState().setQuantity("p1", "WHEY-2LB", 0);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });
});

describe("useCartStore.removeItem + clear", () => {
  it("removeItem drops only the matching line", () => {
    useCartStore.getState().addItem(item({ sku: "A" }));
    useCartStore.getState().addItem(item({ sku: "B" }));
    useCartStore.getState().removeItem("p1", "A");
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].sku).toBe("B");
  });

  it("clear wipes the cart", () => {
    useCartStore.getState().addItem(item());
    useCartStore.getState().addItem(item({ sku: "B" }));
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe("useCartStore selectors", () => {
  it("subtotal sums price * quantity across lines", () => {
    useCartStore.getState().addItem(item({ price: 100, quantity: 2 }));
    useCartStore.getState().addItem(item({ sku: "X", price: 50, quantity: 3 }));
    expect(useCartStore.getState().subtotal()).toBe(350);
  });

  it("count sums quantities", () => {
    useCartStore.getState().addItem(item({ quantity: 2 }));
    useCartStore.getState().addItem(item({ sku: "X", quantity: 5 }));
    expect(useCartStore.getState().count()).toBe(7);
  });
});
