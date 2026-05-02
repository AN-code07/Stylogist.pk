import * as ProductService from "./product.service.js";

// Short public caches on read endpoints so the browser/CDN can serve repeat
// visits instantly. `stale-while-revalidate` means the user gets the cached
// copy immediately while a fresh response is fetched in the background —
// keeps the shop snappy without letting stock/prices drift for long.
const LIST_CACHE_HEADER = "public, max-age=30, stale-while-revalidate=120";
const DETAIL_CACHE_HEADER = "public, max-age=60, stale-while-revalidate=300";

export const createProduct = async (req, res) => {
  const result = await ProductService.createProduct(req.validated.body);
  res.status(201).json({ status: "success", message: "Product created", data: result });
};

export const updateProduct = async (req, res) => {
  const result = await ProductService.updateProduct(req.validated.params.id, req.validated.body);
  res.status(200).json({ status: "success", message: "Product updated", data: result });
};

export const getAllProducts = async (req, res) => {
  const { items, pagination } = await ProductService.getAllProducts(req.query);
  res.set("Cache-Control", LIST_CACHE_HEADER);
  res.status(200).json({ status: "success", results: items.length, pagination, data: items });
};

// Body-driven listing endpoint. Filters travel in the request body so the
// browser URL stays clean (SEO requirement). Cache header set to public so
// the CDN/varnish layer can deduplicate identical filter payloads coming
// from many users — Vary on the body via a custom hash header from the
// frontend if you need finer-grained control.
export const searchProducts = async (req, res) => {
  const result = await ProductService.searchProducts(req.validated.body);
  res.set("Cache-Control", LIST_CACHE_HEADER);
  res.status(200).json({
    status: "success",
    results: result.items.length,
    pagination: result.pagination,
    scope: result.scope,
    data: result.items,
  });
};

export const getProductBySlug = async (req, res) => {
  const result = await ProductService.getProductBySlug(req.params.slug);
  res.set("Cache-Control", DETAIL_CACHE_HEADER);
  res.status(200).json({ status: "success", data: result });
};

export const getProductById = async (req, res) => {
  const result = await ProductService.getProductById(req.params.id);
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
