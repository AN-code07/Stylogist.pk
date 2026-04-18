import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import crypto from "node:crypto";
import sharp from "sharp";
import slugify from "slugify";
import { ApiError } from "../utils/ApiError.js";

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_ROOT)) fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

// We now buffer uploads in memory and encode them to webp on the fly so we
// never persist the original format. This keeps the disk clean and gives us
// consistent, storage-efficient assets.
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

export const buildPublicUrl = (req, filename) => {
  const envBase = process.env.PUBLIC_BASE_URL;
  let base = envBase ? envBase.replace(/\/$/, "") : `${req.protocol}://${req.get("host")}`;
  // Lighthouse "Best Practices" fails as soon as a single http:// asset loads
  // on an https page. Upgrade the scheme unconditionally when we're not on a
  // localhost development host.
  if (/^http:\/\//i.test(base) && !/localhost|127\.0\.0\.1/.test(base)) {
    base = base.replace(/^http:\/\//i, "https://");
  }
  return `${base}/uploads/${filename}`;
};

const slugifyBase = (value, fallback = "image") => {
  if (!value || typeof value !== "string") return fallback;
  const out = slugify(value, { lower: true, strict: true, trim: true });
  return out || fallback;
};

// Build the slug the client wants for this image. Priority:
//  - explicit slug passed by the client (already a slug) -> sanitize & use
//  - productSlug + "image" + index (for gallery images)
//  - productSlug + "thumbnail" (for thumbnails)
//  - random fallback
const buildImageSlug = ({ explicitSlug, productSlug, role = "image", index }) => {
  if (explicitSlug) return slugifyBase(explicitSlug);
  if (productSlug && role === "thumbnail") return `${slugifyBase(productSlug)}-thumbnail`;
  if (productSlug && role === "image") {
    return index != null
      ? `${slugifyBase(productSlug)}-image-${index}`
      : `${slugifyBase(productSlug)}-image`;
  }
  return `image-${Date.now()}`;
};

const ensureUniqueFilename = async (baseName) => {
  let candidate = `${baseName}.webp`;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const full = path.join(UPLOAD_ROOT, candidate);
    if (!fs.existsSync(full)) return { filename: candidate, filePath: full };
    candidate = `${baseName}-${counter}.webp`;
    counter += 1;
  }
};

// Transforms a multer file (buffer) into an optimized webp on disk and returns
// descriptor data the route handler can echo back to the client.
export const processImageToWebp = async (file, { slug, productSlug, role, index, metaTitle = "", metaDescription = "", alt = "" } = {}) => {
  if (!file?.buffer) throw new ApiError(400, "Invalid upload buffer");

  const baseSlug = buildImageSlug({ explicitSlug: slug, productSlug, role, index });
  const { filename, filePath } = await ensureUniqueFilename(baseSlug);

  // Higher quality + max effort → visibly crisper product photos.
  // chromaSubsampling 4:4:4 keeps colour detail (important for reds/oranges
  // in fashion/beauty shots). near-lossless smooths flat areas without
  // ballooning file size.
  //
  // We also cap the longest side at 2000 px so a camera-dump upload
  // (e.g. 6000×4000 / 10 MB JPEG) lands on the storefront at a sensible
  // 150–350 KB. `withoutEnlargement` makes this a ceiling, not a stretch —
  // small source images keep their native resolution.
  await sharp(file.buffer)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85, effort: 6, smartSubsample: true, alphaQuality: 100 })
    .toFile(filePath);

  const { size } = await fsp.stat(filePath);

  return {
    filename,
    filePath,
    size,
    mimetype: "image/webp",
    slug: path.basename(filename, ".webp"),
    metaTitle,
    metaDescription,
    alt: alt || metaTitle,
  };
};

export const deleteLocalUpload = async (filename) => {
  if (!filename) return;
  const safe = path.basename(filename);
  const full = path.join(UPLOAD_ROOT, safe);
  try {
    await fsp.unlink(full);
  } catch {
    // ignore – the file may already be gone
  }
};

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
