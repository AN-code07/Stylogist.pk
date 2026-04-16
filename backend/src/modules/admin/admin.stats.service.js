import Order from "../orders/order.model.js";
import { User } from "../users/user.model.js";
import { Product } from "../products/product.model.js";
import { Variant } from "../products/variant.model.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Orders that have generated revenue (not cancelled/returned).
const REVENUE_STATUSES = ["confirmed", "shipped", "delivered"];

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Picks the right bucket granularity for a timeframe so the series never has
// hundreds of micro-bars (daily for short ranges, weekly for a year).
const bucketFormatFor = (days) => {
  if (days <= 31) return { format: "%Y-%m-%d", unit: "day" };
  if (days <= 90) return { format: "%G-W%V", unit: "week" };
  return { format: "%Y-%m", unit: "month" };
};

// ---------- OVERVIEW ----------

export const getOverviewStats = async () => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekAgo = new Date(todayStart.getTime() - 6 * MS_PER_DAY);

  const [
    todayAgg,
    ordersTodayCount,
    activeCustomers,
    lowStockVariantCount,
    recentOrders,
    weeklyAgg,
    lowStockProducts,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: todayStart }, status: { $in: REVENUE_STATUSES } } },
      { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: todayStart } }),
    User.countDocuments({ role: "User", isVerified: true, isBlocked: false }),
    Variant.countDocuments({ stock: { $lte: 5 }, isActive: true }),
    Order.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: weekAgo },
          status: { $in: REVENUE_STATUSES },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Product.find({ totalStock: { $lte: 5 } })
      .sort({ totalStock: 1 })
      .limit(5)
      .select("name slug totalStock")
      .lean(),
  ]);

  // Fill in missing days in the weekly pulse so the chart always shows 7 bars.
  const byDate = Object.fromEntries(weeklyAgg.map((w) => [w._id, w]));
  const weeklyPulse = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(todayStart.getTime() - i * MS_PER_DAY);
    const key = d.toISOString().slice(0, 10);
    const bucket = byDate[key];
    weeklyPulse.push({
      date: key,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      amount: bucket?.amount || 0,
      orders: bucket?.orders || 0,
    });
  }

  return {
    revenueToday: todayAgg[0]?.revenue || 0,
    ordersToday: ordersTodayCount,
    activeCustomers,
    lowStockCount: lowStockVariantCount,
    recentOrders: recentOrders.map((o) => ({
      _id: o._id,
      customer: o.user?.name || "Guest",
      email: o.user?.email || "",
      amount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt,
      itemsCount: o.items?.length || 0,
    })),
    weeklyPulse,
    lowStockProducts,
  };
};

// ---------- ANALYTICS ----------

// Normalize a timeframe label ("7D" / "30D" / "3M" / "1Y") to a day count.
const timeframeToDays = (tf) => {
  const map = { "7D": 7, "30D": 30, "3M": 90, "1Y": 365 };
  return map[tf] || 30;
};

const pctChange = (current, previous) => {
  if (!previous) return current ? 100 : 0;
  return Number(((current - previous) / previous * 100).toFixed(1));
};

export const getAnalyticsStats = async (timeframe = "30D") => {
  const days = timeframeToDays(timeframe);
  const now = new Date();
  const periodStart = new Date(now.getTime() - days * MS_PER_DAY);
  const prevPeriodStart = new Date(periodStart.getTime() - days * MS_PER_DAY);

  const { format } = bucketFormatFor(days);

  const [
    currentSummary,
    previousSummary,
    revenueSeries,
    categoryShare,
    topProducts,
    returnedCount,
    totalCount,
  ] = await Promise.all([
    // Current-period totals
    Order.aggregate([
      { $match: { createdAt: { $gte: periodStart }, status: { $in: REVENUE_STATUSES } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
    ]),
    // Previous-period totals (same length, shifted back) — for growth comparisons.
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: prevPeriodStart, $lt: periodStart },
          status: { $in: REVENUE_STATUSES },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
    ]),
    // Revenue series, bucketed by the right granularity.
    Order.aggregate([
      { $match: { createdAt: { $gte: periodStart }, status: { $in: REVENUE_STATUSES } } },
      {
        $group: {
          _id: { $dateToString: { format, date: "$createdAt" } },
          amount: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Category share (by number of ordered units across the period).
    Order.aggregate([
      { $match: { createdAt: { $gte: periodStart }, status: { $in: REVENUE_STATUSES } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$category._id",
          name: { $first: "$category.name" },
          units: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { units: -1 } },
    ]),
    // Top products by units sold in the period.
    Order.aggregate([
      { $match: { createdAt: { $gte: periodStart }, status: { $in: REVENUE_STATUSES } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          units: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { units: -1 } },
      { $limit: 5 },
    ]),
    Order.countDocuments({ createdAt: { $gte: periodStart }, status: "returned" }),
    Order.countDocuments({ createdAt: { $gte: periodStart } }),
  ]);

  const current = currentSummary[0] || { revenue: 0, orders: 0 };
  const previous = previousSummary[0] || { revenue: 0, orders: 0 };

  // Net profit is approximated at 35% of gross — the real calc requires COGS data we don't track.
  const estimatedProfit = Math.round(current.revenue * 0.35);
  const estimatedProfitPrev = Math.round(previous.revenue * 0.35);

  const returnRate = totalCount ? Number(((returnedCount / totalCount) * 100).toFixed(2)) : 0;

  // Fill gaps in the revenue series so the chart does not collapse to a single point.
  const filledSeries = fillSeries(revenueSeries, periodStart, now, bucketFormatFor(days));

  const totalUnits = categoryShare.reduce((sum, c) => sum + c.units, 0) || 0;
  const categoryShareFormatted = categoryShare.map((c) => ({
    name: c.name || "Uncategorized",
    units: c.units,
    revenue: c.revenue,
    percentage: totalUnits ? Number(((c.units / totalUnits) * 100).toFixed(1)) : 0,
  }));

  return {
    timeframe,
    summary: {
      grossRevenue: current.revenue,
      revenueGrowth: pctChange(current.revenue, previous.revenue),
      totalOrders: current.orders,
      ordersGrowth: pctChange(current.orders, previous.orders),
      estimatedProfit,
      profitGrowth: pctChange(estimatedProfit, estimatedProfitPrev),
      returnRate,
    },
    revenueSeries: filledSeries,
    categoryShare: categoryShareFormatted,
    topProducts,
  };
};

// Walks the period day-by-day (or week/month) and pads missing buckets with zeros.
// Without this, a quiet week shows as one or two random dots with no context.
function fillSeries(rows, start, end, bucket) {
  const map = Object.fromEntries(rows.map((r) => [r._id, r]));
  const result = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    let key;
    let label;
    if (bucket.unit === "day") {
      key = cursor.toISOString().slice(0, 10);
      label = cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      cursor.setDate(cursor.getDate() + 1);
    } else if (bucket.unit === "week") {
      // ISO week — use a simple approximation (year-week).
      const tmp = new Date(cursor);
      const dayNum = (tmp.getDay() + 6) % 7;
      tmp.setDate(tmp.getDate() - dayNum + 3);
      const firstThursday = new Date(tmp.getFullYear(), 0, 4);
      const week = 1 + Math.round(((tmp - firstThursday) / MS_PER_DAY - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
      key = `${tmp.getFullYear()}-W${String(week).padStart(2, "0")}`;
      label = `W${week}`;
      cursor.setDate(cursor.getDate() + 7);
    } else {
      key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      label = cursor.toLocaleDateString("en-US", { month: "short" });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const hit = map[key];
    result.push({
      key,
      label,
      amount: hit?.amount || 0,
      orders: hit?.orders || 0,
    });
  }
  return result;
}
