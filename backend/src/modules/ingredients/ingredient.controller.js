import * as IngredientService from "./ingredient.service.js";

// Short public caches — the catalogue moves slowly so even a 60s edge
// cache cuts the read load drastically.
const LIST_CACHE = "public, max-age=60, stale-while-revalidate=300";
const DETAIL_CACHE = "public, max-age=120, stale-while-revalidate=600";
// Admin-context override: a Bearer token / JWT cookie OR an admin-only
// status filter forces a no-store so the dashboard reflects mutations
// without a hard refresh.
const NO_STORE = "no-store, no-cache, must-revalidate, max-age=0";

const isAdminContext = (req) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) return true;
  if (req.cookies?.jwt) return true;
  const active = (req.query?.active || "").toString();
  return active === "all";
};

const cacheHeaderFor = (req, publicHeader) =>
  isAdminContext(req) ? NO_STORE : publicHeader;

export const listIngredients = async (req, res) => {
  const { items, pagination } = await IngredientService.listIngredients(req.query);
  res.set("Cache-Control", cacheHeaderFor(req, LIST_CACHE));
  res.status(200).json({ status: "success", results: items.length, pagination, data: items });
};

export const getIngredient = async (req, res) => {
  const ingredient = await IngredientService.getIngredientBySlug(req.params.slug);
  res.set("Cache-Control", cacheHeaderFor(req, DETAIL_CACHE));
  res.status(200).json({ status: "success", data: ingredient });
};

export const getIngredientById = async (req, res) => {
  const ingredient = await IngredientService.getIngredientById(req.params.id);
  // Admin-only path — the storefront fetches by slug. Force fresh.
  res.set("Cache-Control", NO_STORE);
  res.status(200).json({ status: "success", data: ingredient });
};

export const createIngredient = async (req, res) => {
  const ingredient = await IngredientService.createIngredient(req.validated.body);
  res.status(201).json({ status: "success", message: "Ingredient created", data: ingredient });
};

export const updateIngredient = async (req, res) => {
  const ingredient = await IngredientService.updateIngredient(
    req.validated.params.id,
    req.validated.body
  );
  res.status(200).json({ status: "success", message: "Ingredient updated", data: ingredient });
};

export const deleteIngredient = async (req, res) => {
  await IngredientService.deleteIngredient(req.params.id);
  res.status(200).json({ status: "success", message: "Ingredient deleted" });
};

export const getProductsByIngredient = async (req, res) => {
  const result = await IngredientService.getProductsByIngredient(req.params.slug, req.query);
  res.set("Cache-Control", LIST_CACHE);
  res.status(200).json({
    status: "success",
    results: result.items.length,
    pagination: result.pagination,
    ingredient: result.ingredient,
    data: result.items,
  });
};
