import * as ProductService from "./product.service.js";

// Short public caches on read endpoints so the browser/CDN can serve repeat
// visits instantly. `stale-while-revalidate` means the user gets the cached
// copy immediately while a fresh response is fetched in the background —
// keeps the shop snappy without letting stock/prices drift for long.
const LIST_CACHE_HEADER = "public, max-age=30, stale-while-revalidate=120";
const DETAIL_CACHE_HEADER = "public, max-age=60, stale-while-revalidate=300";
// Admin requests must never be served from the browser's HTTP cache —
// otherwise, after a delete/update, React Query's refetch hits the disk
// cache and the admin sees stale data until they hard-refresh. We detect
// the admin context by either a Bearer token on the request, a JWT cookie,
// or a status filter that only admin code ever passes ('all' / 'draft').
const NO_STORE = "no-store, no-cache, must-revalidate, max-age=0";

const isAdminContext = (req) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) return true;
  if (req.cookies?.jwt) return true;
  const status = (req.query?.status || "").toString();
  return status === "all" || status === "draft";
};

// Picks the right cache-control. Admins get a no-store header so their
// dashboard always reflects the latest mutation; anonymous storefront
// traffic keeps the aggressive cache that powers Lighthouse perf.
const cacheHeaderFor = (req, publicHeader) =>
  isAdminContext(req) ? NO_STORE : publicHeader;

export const createProduct = async (req, res) => {
  const result = await ProductService.createProduct(req.validated.body);
  res.status(201).json({ status: "success", message: "Product created", data: result });
};

// Auto-save endpoint: persists whatever the admin had typed into the
// "Add product" form so an accidental navigation away doesn't lose
// their work. Forces status='draft' regardless of payload; the regular
// `PATCH /products/:id` flow handles promotion to published.
export const createDraftProduct = async (req, res) => {
  const result = await ProductService.createDraftProduct(req.validated.body);
  res.status(201).json({ status: "success", message: "Draft saved", data: result });
};

export const updateProduct = async (req, res) => {
  const result = await ProductService.updateProduct(req.validated.params.id, req.validated.body);
  res.status(200).json({ status: "success", message: "Product updated", data: result });
};

export const getAllProducts = async (req, res) => {
  const { items, pagination } = await ProductService.getAllProducts(req.query);
  res.set("Cache-Control", cacheHeaderFor(req, LIST_CACHE_HEADER));
  res.status(200).json({ status: "success", results: items.length, pagination, data: items });
};

// Body-driven listing endpoint. Filters travel in the request body so the
// browser URL stays clean (SEO requirement). Cache header set to public so
// the CDN/varnish layer can deduplicate identical filter payloads coming
// from many users — Vary on the body via a custom hash header from the
// frontend if you need finer-grained control.
export const searchProducts = async (req, res) => {
  const result = await ProductService.searchProducts(req.validated.body);
  res.set("Cache-Control", cacheHeaderFor(req, LIST_CACHE_HEADER));
  res.status(200).json({
    status: "success",
    results: result.items.length,
    pagination: result.pagination,
    scope: result.scope,
    data: result.items,
  });
};

export const getProductBySlug = async (req, res) => {
  try {
    const result = await ProductService.getProductBySlug(req.params.slug);
    res.set("Cache-Control", cacheHeaderFor(req, DETAIL_CACHE_HEADER));
    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    // Service surfaces a tagged ApiError when the slug has been renamed.
    // We respond with the JSON payload `{ redirect: "/product/new-slug" }`
    // so the SPA can navigate without an extra round trip, AND set the
    // Location header so non-JS clients / curl users still see the 301.
    if (err?.statusCode === 301 && err?.redirectTo) {
      // We can't return a real HTTP 301 here because the API client (axios
      // / fetch in a browser) would silently follow the Location header
      // to a SPA route and then GET that as JSON, which 404s. Instead we
      // hand back a 200 envelope tagged `status: "redirect"` so the SPA
      // can navigate to the new product URL itself. The full 301 still
      // works for the dedicated /prerender endpoint that crawlers hit.
      res.set("Cache-Control", "public, max-age=86400");
      return res
        .status(200)
        .json({ status: "redirect", redirect: err.redirectTo });
    }
    throw err;
  }
};

export const getProductById = async (req, res) => {
  const result = await ProductService.getProductById(req.params.id);
  // Admin-only path (the storefront fetches by slug, not id). Force a
  // no-store so the admin product editor always loads the latest server
  // state after a mutation — no stale React Query / browser cache races.
  res.set("Cache-Control", NO_STORE);
  res.status(200).json({ status: "success", data: result });
};

export const deleteProduct = async (req, res) => {
  await ProductService.deleteProduct(req.params.id);
  res.status(200).json({ status: "success", message: "Product deleted" });
};

export const getFilterMetadata = async (_req, res) => {
  const meta = await ProductService.getFilterMetadata();
  res.status(200).json({ status: "success", data: meta });
};
