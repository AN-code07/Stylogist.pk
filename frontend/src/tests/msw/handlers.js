import { http, HttpResponse } from "msw";

// Default API mock surface. Mirrors just enough of the real backend
// shape that hooks under test see a realistic response without us
// re-implementing the business logic. Tests that need a specific
// payload override these via `server.use(...)` for the duration of
// the test.

const API = "http://localhost:5000/api/v1";

export const sampleProduct = {
  _id: "p1",
  slug: "whey-protein-2lb",
  name: "Whey Protein 2lb",
  minPrice: 4999,
  maxPrice: 5999,
  averageRating: 4.5,
  totalReviews: 10,
  totalStock: 25,
  // Per-product tax (PDP renders the order-summary tax row when > 0).
  taxPercent: 17,
  image: "/uploads/whey.jpg",
  brand: { _id: "b1", name: "Optimum Nutrition", slug: "optimum-nutrition" },
  category: { _id: "c1", name: "Protein", slug: "protein" },
  // New content shapes: benefits/uses are {text, image}[], whyLoveIt is
  // title-only, ingredientHighlight mirrors howToUse.
  benefits: [{ text: "Better sleep", image: "" }],
  uses: [{ text: "Take 1 daily", image: "" }],
  whyLoveIt: [{ title: "Doctor recommended" }],
  howToUse: { text: "", image: "" },
  ingredientHighlight: { text: "", image: "" },
  ingredients: [],
};

export const handlers = [
  http.get(`${API}/products`, () =>
    HttpResponse.json({
      status: "success",
      results: 1,
      pagination: { page: 1, limit: 12, total: 1, pages: 1 },
      data: [sampleProduct],
    })
  ),

  http.get(`${API}/products/:slug`, ({ params }) =>
    HttpResponse.json({
      status: "success",
      data: {
        product: { ...sampleProduct, slug: params.slug },
        variants: [
          {
            _id: "v1",
            sku: "WHEY-2LB",
            size: "2lb",
            salePrice: 4999,
            originalPrice: 5999,
            stock: 25,
            isActive: true,
          },
        ],
        media: [{ _id: "m1", url: "/uploads/whey.jpg", isThumbnail: true }],
      },
    })
  ),

  // Default empty stubs for other resources hit by the navbar/footer.
  http.get(`${API}/categories`, () =>
    HttpResponse.json({ status: "success", results: 0, data: [] })
  ),
  http.get(`${API}/brands`, () =>
    HttpResponse.json({ status: "success", results: 0, data: [] })
  ),
  http.get(`${API}/settings`, () =>
    HttpResponse.json({
      status: "success",
      data: { footer: { brandTagline: "", shopLinks: [] }, about: { visionaries: [] } },
    })
  ),
  http.get(`${API}/users/me`, () =>
    HttpResponse.json({ status: "fail", message: "Not logged in" }, { status: 401 })
  ),
];
