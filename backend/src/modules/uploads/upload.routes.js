import { Router } from "express";
import { uploadImage, processImageToWebp } from "../../middlewares/upload.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { restrictTo } from "../../middlewares/role.middleware.js";
import { ApiError } from "../../utils/ApiError.js";
import { catchAsync } from "../../utils/catchAsync.js";

const router = Router();

// Single image upload.
// Body fields (optional):
//   productSlug    – used to name the file (e.g. silk-dress → silk-dress-image-1.webp)
//   role           – "thumbnail" | "image" | "editor" (default: "image")
//   index          – numeric suffix for gallery images
//   slug           – explicit slug override (takes precedence over productSlug)
//   metaTitle, metaDescription, alt – echoed back so the client can persist them.
router.post(
  "/image",
  authMiddleware,
  restrictTo("Super Admin", "Staff"),
  uploadImage.single("file"),
  catchAsync(async (req, res, next) => {
    if (!req.file) return next(new ApiError(400, "No file uploaded. Attach a 'file' field."));

    const { productSlug, role, index, slug, metaTitle, metaDescription, alt } = req.body || {};
    const processed = await processImageToWebp(req.file, {
      slug,
      productSlug,
      role: role || "image",
      index: index != null && index !== "" ? Number(index) : undefined,
      metaTitle,
      metaDescription,
      alt,
    });

    res.status(201).json({
      status: "success",
      data: {
        url: processed.url,
        filename: processed.filename,
        publicId: processed.publicId,
        slug: processed.slug,
        size: processed.size,
        mimetype: processed.mimetype,
        width: processed.width,
        height: processed.height,
        metaTitle: processed.metaTitle,
        metaDescription: processed.metaDescription,
        alt: processed.alt,
      },
    });
  })
);

// Batch image upload — useful for product galleries.
// Body fields (optional):
//   productSlug    – used to name files (productSlug-image-1.webp, -2.webp…)
//   startIndex     – first numeric suffix (defaults to 1)
//   metaTitle, metaDescription – applied to every file in this batch.
router.post(
  "/images",
  authMiddleware,
  restrictTo("Super Admin", "Staff"),
  uploadImage.array("files", 12),
  catchAsync(async (req, res, next) => {
    if (!req.files?.length) return next(new ApiError(400, "No files uploaded. Attach 'files' fields."));

    const { productSlug, startIndex, metaTitle, metaDescription } = req.body || {};
    const start = startIndex != null && startIndex !== "" ? Number(startIndex) : 1;

    const files = [];
    for (let i = 0; i < req.files.length; i += 1) {
      const f = req.files[i];
      const processed = await processImageToWebp(f, {
        productSlug,
        role: "image",
        index: start + i,
        metaTitle,
        metaDescription,
        alt: metaTitle,
      });
      files.push({
        url: processed.url,
        filename: processed.filename,
        publicId: processed.publicId,
        slug: processed.slug,
        size: processed.size,
        mimetype: processed.mimetype,
        width: processed.width,
        height: processed.height,
        metaTitle: processed.metaTitle,
        metaDescription: processed.metaDescription,
        alt: processed.alt,
      });
    }

    res.status(201).json({ status: "success", results: files.length, data: files });
  })
);

export default router;
