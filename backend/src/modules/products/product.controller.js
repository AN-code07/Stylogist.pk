import * as ProductService from "./product.service.js";
import { catchAsync } from "../../utils/catchAsync.js";

export const createProduct = catchAsync(async (req, res) => {
  const productData = req.validated.body;
  const product = await ProductService.createProduct(productData);

  res.status(201).json({
    success: true,
    data: product,
  });
});

export const getAllProducts = catchAsync(async (req, res) => {
  const products = await ProductService.getAllProducts(req.query);
  res.json({ success: true, data: products });
});

export const getSingleProduct = catchAsync(async (req, res) => {
  const result = await ProductService.getSingleProduct(req.params.slug);
  res.json({ success: true, data: result });
});

export const getFilterMetadata = async () => {
  const brands = await Product.distinct("brand", { status: "published" });

  const priceData = await Product.aggregate([
    { $match: { status: "published" } },
    {
      $group: {
        _id: null,
        min: { $min: "$minPrice" },
        max: { $max: "$minPrice" }
      }
    }
  ]);

  return {
    brands,
    priceRange: priceData[0] || { min: 0, max: 0 }
  };
};