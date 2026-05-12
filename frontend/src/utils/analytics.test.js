import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  trackPageView,
  trackViewItem,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  trackSearch,
} from "./analytics.js";

// Tests run with VITE_GA_MEASUREMENT_ID="" so bootstrapAnalytics is a no-op.
// We inject a fake `window.gtag` directly so the track* helpers (which
// only call gtag if it exists) actually fire and we can assert on the
// payloads. This isolates the helper contract from the script-injection
// side of the bootstrap.

describe("analytics helpers", () => {
  let gtag;

  beforeEach(() => {
    gtag = vi.fn();
    window.gtag = gtag;
  });

  it("trackPageView fires a page_view event with path + title", () => {
    document.title = "Test Page";
    trackPageView("/products");
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "page_view",
      expect.objectContaining({
        page_path: "/products",
        page_title: "Test Page",
      })
    );
  });

  it("trackViewItem maps product → GA4 items[] shape", () => {
    trackViewItem({
      _id: "p1",
      name: "Whey",
      minPrice: 4999,
      brand: { name: "ON" },
      category: { name: "Protein" },
    });
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "view_item",
      expect.objectContaining({
        currency: "PKR",
        value: 4999,
        items: [
          expect.objectContaining({
            item_id: "p1",
            item_name: "Whey",
            item_brand: "ON",
            item_category: "Protein",
            price: 4999,
            quantity: 1,
          }),
        ],
      })
    );
  });

  it("trackAddToCart multiplies value by quantity", () => {
    trackAddToCart({ _id: "p1", name: "Whey", minPrice: 4999 }, 3);
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "add_to_cart",
      expect.objectContaining({ value: 4999 * 3 })
    );
  });

  it("trackBeginCheckout serialises cart items into GA4 shape", () => {
    trackBeginCheckout(
      [{ productId: "p1", name: "Whey", price: 100, quantity: 2 }],
      200
    );
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "begin_checkout",
      expect.objectContaining({
        value: 200,
        items: [
          expect.objectContaining({ item_id: "p1", price: 100, quantity: 2 }),
        ],
      })
    );
  });

  it("trackPurchase carries the order id as transaction_id", () => {
    trackPurchase({
      orderId: "ord-1",
      total: 500,
      items: [{ productId: "p1", name: "X", price: 250, quantity: 2 }],
    });
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "purchase",
      expect.objectContaining({
        transaction_id: "ord-1",
        value: 500,
      })
    );
  });

  it("trackSearch is a no-op for empty terms", () => {
    trackSearch("");
    expect(gtag).not.toHaveBeenCalled();
  });

  it("track* helpers are silent no-ops when window.gtag is missing", () => {
    delete window.gtag;
    // Should not throw.
    expect(() => trackViewItem({ _id: "p1", name: "X" })).not.toThrow();
  });
});
