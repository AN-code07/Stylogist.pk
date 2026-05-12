import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MobileBuyBar from "./MobileBuyBar.jsx";

const renderBar = (overrides = {}) =>
  render(
    <MobileBuyBar
      price={4999}
      originalPrice={5999}
      outOfStock={false}
      onAddToCart={vi.fn()}
      onBuyNow={vi.fn()}
      {...overrides}
    />
  );

describe("<MobileBuyBar />", () => {
  it("renders the active price + strikethrough original", () => {
    renderBar();
    expect(screen.getByText("Rs 4,999")).toBeInTheDocument();
    expect(screen.getByText("Rs 5,999")).toBeInTheDocument();
  });

  it("hides the strikethrough original when prices are equal", () => {
    renderBar({ originalPrice: 4999 });
    expect(screen.getAllByText("Rs 4,999")).toHaveLength(1);
  });

  it("calls onAddToCart when the Cart button is clicked", async () => {
    const onAddToCart = vi.fn();
    renderBar({ onAddToCart });
    await userEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });

  it("calls onBuyNow when the Buy Now button is clicked", async () => {
    const onBuyNow = vi.fn();
    renderBar({ onBuyNow });
    await userEvent.click(screen.getByRole("button", { name: /buy now/i }));
    expect(onBuyNow).toHaveBeenCalledTimes(1);
  });

  it("disables both buttons when outOfStock is true", async () => {
    const onAddToCart = vi.fn();
    const onBuyNow = vi.fn();
    renderBar({ outOfStock: true, onAddToCart, onBuyNow });

    const cart = screen.getByRole("button", { name: /add to cart/i });
    const unavail = screen.getByRole("button", { name: /buy now/i });
    expect(cart).toBeDisabled();
    expect(unavail).toBeDisabled();
    // Label flips to "Unavailable" when out of stock.
    expect(unavail).toHaveTextContent(/unavailable/i);
  });
});
