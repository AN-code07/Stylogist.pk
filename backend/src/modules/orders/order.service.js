import mongoose from "mongoose";
import { Product } from "../products/product.model.js";
import { Variant } from "../products/variant.model.js";
import { Category } from "../categories/category.model.js";
import { Address } from "../address/address.model.js";
import Order from "./order.model.js";
import { ApiError } from "../../utils/ApiError.js";

const REVENUE_STATUSES = ["confirmed", "shipped", "delivered"];

// Accepts both authenticated and guest orders.
// - Registered: `userId` provided → resolve `addressId` from the user's Address book
// - Guest: `userId` is null, caller must provide `guest` + `guestAddress` inline
export const createOrder = async (userId, orderData) => {
  const { items, addressId, guest, guestAddress, paymentMethod = "COD" } = orderData;

  let resolvedAddress = null;
  if (userId) {
    if (!addressId) throw new ApiError(400, "Shipping address is required");
    resolvedAddress = await Address.findOne({ _id: addressId, userId });
    if (!resolvedAddress) throw new ApiError(404, "Shipping address not found");
  } else {
    if (!guest || !guestAddress) {
      throw new ApiError(400, "Guest checkout requires customer info and address");
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        status: "published",
      }).session(session);

      if (!product) throw new ApiError(404, "Product not found or unpublished");

      // Categories can be archived independently of their products — double-check.
      const category = await Category.findById(product.category).session(session);
      if (!category || !category.isActive) {
        throw new ApiError(400, `Product "${product.name}" is currently unavailable`);
      }

      // Variants live in a separate collection, keyed on (product, sku).
      const variant = await Variant.findOne({
        product: product._id,
        sku: item.sku,
      }).session(session);

      if (!variant) throw new ApiError(400, `SKU ${item.sku} not found for "${product.name}"`);
      if (!variant.isActive) throw new ApiError(400, `SKU ${item.sku} is no longer available`);

      if (variant.stock < item.quantity) {
        throw new ApiError(400, `Only ${variant.stock} left of "${product.name}" (${variant.sku})`);
      }

      const lineSubtotal = variant.salePrice * item.quantity;
      subtotal += lineSubtotal;

      // Deduct from both the variant's stock and the denormalized product total.
      variant.stock -= item.quantity;
      product.totalStock = Math.max(0, (product.totalStock || 0) - item.quantity);
      product.totalSales = (product.totalSales || 0) + item.quantity;

      await variant.save({ session });
      await product.save({ session });

      orderItems.push({
        product: product._id,
        sku: variant.sku,
        name: product.name,
        price: variant.salePrice,
        quantity: item.quantity,
        subtotal: lineSubtotal, // matches the schema — previous code used `total` here and silently failed validation
      });
    }

    const shippingFee = 0; // Free delivery for now.
    const totalAmount = subtotal + shippingFee;

    const [order] = await Order.create(
      [
        {
          user: userId || null,
          guest: userId ? undefined : guest,
          items: orderItems,
          shippingAddress: resolvedAddress ? resolvedAddress._id : null,
          guestAddress: userId ? undefined : guestAddress,
          paymentMethod,
          subtotal,
          shippingFee,
          totalAmount,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ---------- Customer: their own orders ----------

export const listMyOrders = async (userId, query = {}) => {
  const { page = 1, limit = 20, status } = query;

  const filter = { user: userId };
  if (status && status !== "all") filter.status = status;

  const pageNum = Math.max(Number(page), 1);
  const pageSize = Math.min(Math.max(Number(limit), 1), 50);

  const [items, total, summary] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Order.countDocuments(filter),
    Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpend: {
            $sum: {
              $cond: [{ $in: ["$status", REVENUE_STATUSES] }, "$totalAmount", 0],
            },
          },
        },
      },
    ]),
  ]);

  return {
    items,
    pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) },
    summary: summary[0] || { totalOrders: 0, totalSpend: 0 },
  };
};

export const getMyOrder = async (userId, id) => {
  const order = await Order.findOne({ _id: id, user: userId }).lean();
  if (!order) throw new ApiError(404, "Order not found");
  return order;
};
