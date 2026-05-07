import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import slugify from "slugify";
import { ApiError } from "../utils/ApiError.js";
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from "../config/cloudinary.js";

// Multer surfaces its own `MulterError` class for things like
// LIMIT_FILE_SIZE — those aren't ApiError instances and would otherwise
// hit the prod fallback ("Something went very wrong!"). This helper runs
// the multer parser and rewrites every failure as an operational
// ApiError so the admin sees the actual cause.
const runMulter = (multerHandler) => (req, res, next) =>
  multerHandler(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const map = {
        LIMIT_FILE_SIZE: "Image too large. Maximum allowed size is 10 MB per file.",
        LIMIT_FILE_COUNT: "Too many files. Upload up to 12 at a time.",
        LIMIT_UNEXPECTED_FILE: `Unexpected file field "${err.field}".`,
      };
      const message = map[err.code] || `Upload failed: ${err.message}`;
      return next(new ApiError(400, message));
    }
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(400, err.message || "Upload failed"));
  });


const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

// We buffer uploads in memory and re-encode them to webp before streaming
// to Cloudinary. Sharp keeps the local pipeline (rotation fix, size cap,
// quality preset) consistent with what we used to produce on disk; we
// just hand the resulting buffer off to the CDN instead of writing it.
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`), false);
  }
  cb(null, true);
};

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Convenience wrappers for routes — translate Multer's raw errors into
// ApiError so the global error handler sends the actual cause to the
// client instead of the generic prod fallback.
export const uploadSingleImage = (field = "file") =>
  runMulter(uploadImage.single(field));
export const uploadArrayImages = (field = "files", max = 12) =>
  runMulter(uploadImage.array(field, max));

const slugifyBase = (value, fallback = "image") => {
  if (!value || typeof value !== "string") return fallback;
  const out = slugify(value, { lower: true, strict: true, trim: true });
  return out || fallback;
};

// Build the slug the client wants for this image. Priority:
//  - explicit slug passed by the client (already a slug) -> sanitize & use
//  - productSlug + "thumbnail" (for thumbnails)
//  - productSlug + "image" + index (for gallery images)
//  - random fallback
const buildImageSlug = ({ explicitSlug, productSlug, role = "image", index }) => {
  if (explicitSlug) return slugifyBase(explicitSlug);
  if (productSlug && role === "thumbnail") return `${slugifyBase(productSlug)}-thumbnail`;
  if (productSlug && role === "image") {
    return index != null
      ? `${slugifyBase(productSlug)}-image-${index}`
      : `${slugifyBase(productSlug)}-image`;
  }
  return `image-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
};

// Take a multer file (in-memory buffer), compress to webp, upload to
// Cloudinary, and return the descriptor the route handler echoes back
// to the client. URL stored in the DB is Cloudinary's `secure_url` —
// a CDN-backed https endpoint that survives container redeploys.
export const processImageToWebp = async (
  file,
  { slug, productSlug, role, index, metaTitle = "", metaDescription = "", alt = "" } = {},
) => {
  if (!file?.buffer) throw new ApiError(400, "Invalid upload buffer");

  // Fail-fast with an *operational* error when Cloudinary creds are
  // missing. Without this the SDK returns an opaque 401 that the global
  // error handler renders as the generic "Something went very wrong!"
  // page in production.
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new ApiError(
      500,
      "Image storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the backend env.",
    );
  }

  // 1. Sharp pipeline — rotate (EXIF), cap longest side at 2000px so
  //    camera-dump uploads (6000×4000) compress down to a sensible
  //    150–350 KB, and re-encode as webp at quality 85 / effort 6.
  let webpBuffer;
  try {
    webpBuffer = await sharp(file.buffer)
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85, effort: 6, smartSubsample: true, alphaQuality: 100 })
      .toBuffer();
  } catch (err) {
    throw new ApiError(400, `Image processing failed: ${err?.message || "unknown error"}`);
  }

  // 2. Cloudinary upload via stream. We set `overwrite: true` so re-
  //    uploading under the same slug replaces the previous asset
  //    (otherwise Cloudinary returns a 409 which the SDK throws as a
  //    raw error). `invalidate: true` purges the CDN edge cache so
  //    admins see the new image immediately.
  const baseSlug = buildImageSlug({ explicitSlug: slug, productSlug, role, index });
  let result;
  try {
    result = await uploadBufferToCloudinary(webpBuffer, {
      public_id: baseSlug,
      format: "webp",
      overwrite: true,
      invalidate: true,
    });
  } catch (err) {
    // Cloudinary errors carry a `message` plus a `http_code`. Surface
    // them as an operational ApiError so the admin sees the real cause.
    const msg = err?.message || err?.error?.message || "Unknown Cloudinary error";
    const status = err?.http_code || 500;
    console.error("[cloudinary] upload failed:", err);
    throw new ApiError(status, `Image upload failed: ${msg}`);
  }

  return {
    filename: result.public_id,
    publicId: result.public_id,
    size: result.bytes,
    mimetype: "image/webp",
    width: result.width,
    height: result.height,
    slug: baseSlug,
    metaTitle,
    metaDescription,
    alt: alt || metaTitle,
    url: result.secure_url, // canonical https URL stored in the DB
  };
};

// Public URL helper. With Cloudinary every uploader already returns a
// fully-qualified `secure_url`, so this is a no-op pass-through. We keep
// the export so route handlers don't have to change their call sites.
// Accepts either a full URL (returned verbatim) or a public_id (built
// into a Cloudinary delivery URL on the fly).
export const buildPublicUrl = (_req, urlOrPublicId) => {
  if (!urlOrPublicId) return "";
  if (/^https?:\/\//i.test(urlOrPublicId)) return urlOrPublicId;
  // Fallback: synthesise a delivery URL when only a public_id is known.
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloud) return urlOrPublicId;
  return `https://res.cloudinary.com/${cloud}/image/upload/${urlOrPublicId}.webp`;
};

// Best-effort delete by Cloudinary public_id.
export const deleteUploadedAsset = async (publicId) => {
  if (!publicId) return;
  await deleteFromCloudinary(publicId);
};

// Back-compat alias for older callers that still reference the local
// disk helper. Routes through Cloudinary now.
export const deleteLocalUpload = deleteUploadedAsset;

// Legacy random-name generator, kept for non-image uploads if ever needed.
export const randomName = (originalName) => {
  const ext = path.extname(originalName).toLowerCase() || ".bin";
  const base = path
    .basename(originalName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "file";
  const unique = crypto.randomBytes(6).toString("hex");
  return `${base}-${Date.now()}-${unique}${ext}`;
};
