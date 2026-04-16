import { Router } from "express";
import { uploadImage, buildPublicUrl } from "../../middlewares/upload.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { restrictTo } from "../../middlewares/role.middleware.js";
import { ApiError } from "../../utils/ApiError.js";
import { catchAsync } from "../../utils/catchAsync.js";

const router = Router();

// Single image upload — returns the absolute URL the client should persist
// when creating a brand / category / product.
router.post(
  "/image",
  authMiddleware,
  restrictTo("Super Admin", "Staff"),
  uploadImage.single("file"),
  catchAsync(async (req, res, next) => {
    if (!req.file) return next(new ApiError(400, "No file uploaded. Attach a 'file' field."));

    const url = buildPublicUrl(req, req.file.filename);
    res.status(201).json({
      status: "success",
      data: {
        url,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  })
);

// Batch image upload — useful for product galleries.
router.post(
  "/images",
  authMiddleware,
  restrictTo("Super Admin", "Staff"),
  uploadImage.array("files", 12),
  catchAsync(async (req, res, next) => {
    if (!req.files?.length) return next(new ApiError(400, "No files uploaded. Attach 'files' fields."));

    const files = req.files.map((f) => ({
      url: buildPublicUrl(req, f.filename),
      filename: f.filename,
      size: f.size,
      mimetype: f.mimetype,
    }));

    res.status(201).json({ status: "success", results: files.length, data: files });
  })
);

export default router;
