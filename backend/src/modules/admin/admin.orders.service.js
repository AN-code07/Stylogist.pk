import Order from "../orders/order.model.js";
import { User } from "../users/user.model.js";
import { ApiError } from "../../utils/ApiError.js";

const VALID_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"];

// Lists orders for the admin dashboard. Supports status filter, free-text search
// across customer name/email and order id, and pagination.
export const listOrders = async (query = {}) => {
  const { status = "all", search = "", page = 1, limit = 25, from, to } = query;

  const filter = {};
  if (VALID_STATUSES.includes(status)) filter.status = status;

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  // Search: by order id (hex tail), or by matching user name/email.
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const userIds = await User.find({ $or: [{ name: rx }, { email: rx }, { phone: rx }] }).distinct("_id");
    const or = [{ user: { $in: userIds } }];
    // Allow searching by the last ~6 chars of the order id (which is what the UI displays).
    if (/^[0-9a-fA-F]{6,24}$/.test(search)) {
      const orderMatches = await Order.find({
        _id: { $regex: new RegExp(search + "$", "i") },
      })
        .select("_id")
        .lean()
        .catch(() => []);
      if (orderMatches.length) or.push({ _id: { $in: orderMatches.map((o) => o._id) } });
    }
    filter.$or = or;
  }

  const pageNum = Math.max(Number(page), 1);
  const pageSize = Math.min(Math.max(Number(limit), 1), 100);

  // The Order model has a pre(/^find/) hook that auto-populates user + shippingAddress.
  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    items,
    pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) },
  };
};

export const getOrderById = async (id) => {
  const order = await Order.findById(id).lean();
  if (!order) throw new ApiError(404, "Order not found");
  return order;
};

export const updateOrderStatus = async (id, status) => {
  if (!VALID_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status. Use one of: ${VALID_STATUSES.join(", ")}`);
  }
  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");
  order.status = status;
  await order.save();
  return order.toObject();
};
