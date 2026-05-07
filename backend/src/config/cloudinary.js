import { v2 as cloudinary } from "cloudinary";
import env from "./env.js";

// Configure once at boot. The SDK caches this on its module-scoped state,
// so subsequent imports across the app reuse the same configured client.
cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

// Boot-time status banner. We never print the secret values themselves —
// just whether each one was found at runtime — so you can spot a missing
// .env in the dev console without rebooting through the upload flow.
const ok = (v) => (v && v.toString().trim() ? "ok" : "MISSING");
const allOk =
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret;

if (allOk) {
  console.log(
    `[cloudinary] configured · cloud_name=${env.cloudinary.cloudName} · folder=${env.cloudinary.folder}`,
  );
} else {
  console.warn(
    "[cloudinary] env check failed · " +
      `CLOUDINARY_CLOUD_NAME=${ok(env.cloudinary.cloudName)} · ` +
      `CLOUDINARY_API_KEY=${ok(env.cloudinary.apiKey)} · ` +
      `CLOUDINARY_API_SECRET=${ok(env.cloudinary.apiSecret)} ` +
      "— image uploads will fail until these are filled into backend/.env and the server is restarted.",
  );
}

// Stream-upload a buffer to Cloudinary. Returns the SDK's response object
// so callers can pick whatever fields they need (`secure_url`, `public_id`,
// `bytes`, `width`, `height`, etc.). `public_id` is optional — Cloudinary
// auto-generates one when omitted, but supplying it lets us mirror our
// slug-based filename convention so the asset URL stays human-readable.
export const uploadBufferToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || env.cloudinary.folder,
      resource_type: options.resource_type || "image",
      public_id: options.public_id,
      format: options.format,
      // Default to overwrite so admins can re-upload the same slug
      // without hitting a 409. Callers can opt out by passing false.
      overwrite: options.overwrite ?? true,
      // Invalidate the CDN edge cache when overwriting so the new
      // image is served immediately instead of after the TTL window.
      invalidate: options.invalidate ?? true,
      // unique_filename only applies when use_filename is true; keep
      // it explicit so we get reproducible URLs from our slug.
      unique_filename: false,
      use_filename: false,
    };
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (err, result) => {
      if (err) return reject(err);
      if (!result) return reject(new Error("Cloudinary upload returned no result"));
      resolve(result);
    });
    stream.on("error", reject);
    stream.end(buffer);
  });

// Best-effort delete by public_id. Useful for cleanup flows; we don't
// throw on failure because losing a stale asset isn't a deal breaker.
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn(`[cloudinary] Failed to delete ${publicId}:`, err?.message);
    return null;
  }
};

export default cloudinary;
