import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
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

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_ROOT),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".bin";
    const base = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "file";
    const unique = crypto.randomBytes(6).toString("hex");
    cb(null, `${base}-${Date.now()}-${unique}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`), false);
  }
  cb(null, true);
};

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Build the public URL for a stored file. Prefer PUBLIC_BASE_URL when set
// (e.g. in production behind a CDN/proxy); otherwise derive from the request.
export const buildPublicUrl = (req, filename) => {
  const envBase = process.env.PUBLIC_BASE_URL;
  const base = envBase ? envBase.replace(/\/$/, "") : `${req.protocol}://${req.get("host")}`;
  return `${base}/uploads/${filename}`;
};
