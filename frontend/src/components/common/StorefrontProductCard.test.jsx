import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import StorefrontProductCard from "./StorefrontProductCard.jsx";
import useWishlistStore from "../../store/useWishlistStore.js";

const renderCard = (product, props = {}) =>
  render(
    <MemoryRouter>
      <StorefrontProductCard product={product} {...props} />
    </MemoryRouter>
  );

const baseProduct = {
  _id: "p1",
  slug: "whey-2lb",
  name: "Whey Protein 2lb",
  minPrice: 4999,
  maxPrice: 5999,
  averageRating: 4.5,
  totalReviews: 10,
  totalStock: 25,
  image: "/uploads/whey.jpg",
  brand: { name: "Optimum Nutrition" },
};

beforeEach(() => {
  useWishlistStore.setState({ items: [] });
});

describe("<StorefrontProductCard />", () => {
  it("renders product name + sale price", () => {
    renderCard(baseProduct);
    expect(screen.getByText("Whey Protein 2lb")).toBeInTheDocument();
    expect(screen.getByText("Rs 4,999")).toBeInTheDocument();
  });

  it("renders the brand kicker when brand.name is present", () => {
    renderCard(baseProduct);
    expect(screen.getByText(/Optimum Nutrition/i)).toBeInTheDocument();
  });

  it("renders a discount badge derived from min/max price", () => {
    renderCard(baseProduct);
    // (5999-4999)/5999 = ~17%
    expect(screen.getByText(/-17%/)).toBeInTheDocument();
  });

  it('shows "Sold out" when totalStock is 0', () => {
    renderCard({ ...baseProduct, totalStock: 0 });
    expect(screen.getByText(/sold out/i)).toBeInTheDocument();
  });

  it("renders the Trending badge for variant='trending'", () => {
    renderCard(baseProduct, { variant: "trending" });
    expect(screen.getByText(/trending/i)).toBeInTheDocument();
  });

  it("links to /product/:slug on the image and title", () => {
    renderCard(baseProduct);
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/product/whey-2lb")).toBe(true);
  });

  it("toggles wishlist state when the heart button is clicked", async () => {
    renderCard(baseProduct);
    expect(useWishlistStore.getState().items).toHaveLength(0);

    await userEvent.click(screen.getByRole("button", { name: /add to wishlist/i }));
    expect(useWishlistStore.getState().items).toHaveLength(1);
    expect(useWishlistStore.getState().items[0].productId).toBe("p1");

    // Re-click toggles it off.
    await userEvent.click(screen.getByRole("button", { name: /remove from wishlist/i }));
    expect(useWishlistStore.getState().items).toHaveLength(0);
  });
});
