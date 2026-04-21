import * as SettingsService from "./settings.service.js";

// Short cache on the public read so repeat pageviews don't touch Mongo.
// SWR lets the browser serve the stale copy instantly while refreshing.
const PUBLIC_CACHE = "public, max-age=60, stale-while-revalidate=300";

export const getPublicSettings = async (_req, res) => {
  const data = await SettingsService.getPublicSettings();
  res.set("Cache-Control", PUBLIC_CACHE);
  res.status(200).json({ status: "success", data });
};

export const updateSettings = async (req, res) => {
  const data = await SettingsService.updateSettings(req.body);
  res.status(200).json({ status: "success", message: "Settings updated", data });
};
