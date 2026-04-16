import Order from "../orders/order.model.js";
import { User } from "../users/user.model.js";
import { ApiError } from "../../utils/ApiError.js";

const REVENUE_STATUSES = ["confirmed", "shipped", "delivered"];

// Lists customer users with order stats joined in a single aggregation,
// so the UI can show LTV + order count without N+1 queries.
export const listCustomers = async (query = {}) => {
  const { search = "", status = "all", page = 1, limit = 25 } = query;

  const match = { role: "User" };
  if (status === "active") match.isBlocked = false;
  else if (status === "blocked") match.isBlocked = true;

  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    match.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const pageNum = Math.max(Number(page), 1);
  const pageSize = Math.min(Math.max(Number(limit), 1), 100);

  const pipeline = [
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $skip: (pageNum - 1) * pageSize },
    { $limit: pageSize },
    {
      $lookup: {
        from: "orders",
        let: { userId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$user", "$$userId"] } } },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalSpend: {
                $sum: {
                  $cond: [
                    { $in: ["$status", REVENUE_STATUSES] },
                    "$totalAmount",
                    0,
                  ],
                },
              },
              lastOrderAt: { $max: "$createdAt" },
            },
          },
        ],
        as: "orderStats",
      },
    },
    {
      $addFields: {
        orderStats: { $ifNull: [{ $arrayElemAt: ["$orderStats", 0] }, {}] },
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        phone: 1,
        role: 1,
        isVerified: 1,
        isBlocked: 1,
        createdAt: 1,
        totalOrders: { $ifNull: ["$orderStats.totalOrders", 0] },
        totalSpend: { $ifNull: ["$orderStats.totalSpend", 0] },
        lastOrderAt: "$orderStats.lastOrderAt",
      },
    },
  ];

  const [items, total] = await Promise.all([
    User.aggregate(pipeline),
    User.countDocuments(match),
  ]);

  return {
    items,
    pagination: {
      page: pageNum,
      limit: pageSize,
      total,
      pages: Math.ceil(total / pageSize),
    },
  };
};

export const getCustomerProfile = async (id) => {
  const user = await User.findOne({ _id: id, role: "User" }).lean();
  if (!user) throw new ApiError(404, "Customer not found");

  const [orderStats, recentOrders] = await Promise.all([
    Order.aggregate([
      { $match: { user: user._id } },
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
    Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    user,
    stats: orderStats[0] || { totalOrders: 0, totalSpend: 0 },
    recentOrders: recentOrders.map((o) => ({
      _id: o._id,
      createdAt: o.createdAt,
      status: o.status,
      totalAmount: o.totalAmount,
      itemsCount: o.items?.length || 0,
      items: (o.items || []).slice(0, 3).map((i) => ({ name: i.name, sku: i.sku })),
    })),
  };
};

export const setCustomerBlocked = async (id, blocked) => {
  const user = await User.findOne({ _id: id, role: "User" });
  if (!user) throw new ApiError(404, "Customer not found");
  user.isBlocked = blocked;
  await user.save();
  return user.toObject();
};
