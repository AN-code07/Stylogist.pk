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

if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
  // Soft warning rather than process.exit — local dev environments
  // sometimes spin up without Cloudinary creds, and we still want the
  // rest of the API to come up. Uploads will fail loudly when invoked.
  console.warn(
    "[cloudinary] Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET. Image uploads will fail until these are set.",
  );
}

// Stream-upload a buffer to Cloudinary. Returns the SDK's response object
// so callers can pick whatever fields they need (`secure_url`, `public_id`,
// `bytes`, `width`, `height`, etc.). `public_id` is optional — Cloudinary
// auto-generates one when omitted, but supplying it lets us mirror our
// slug-based filename convention so the asset URL stays human-readable.
export const uploadBufferToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || env.cloudinary.folder,
        resource_type: options.resource_type || "image",
        public_id: options.public_id,
        format: options.format,
        overwrite: options.overwrite ?? false,
        unique_filename: options.unique_filename ?? true,
        // Even with a webp buffer we let Cloudinary keep the original
        // format header (`format: 'webp'`) so the delivered URL stays
        // .webp rather than re-encoding to whatever Cloudinary defaults to.
      },
      (err, result) => {
        if (err) return reject(err);
        if (!result) return reject(new Error("Cloudinary upload returned no result"));
        resolve(result);
      },
    );
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
