import Order from "../orders/order.model.js";
import { User } from "../users/user.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendEmail } from '../../utils/email.js';

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



export const updateOrderStatus = async (id, status, trackingCompany, trackingLink, trackingId) => {
  if (!VALID_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status. Use one of: ${VALID_STATUSES.join(", ")}`);
  }

  const order = await Order.findById(id).populate('user', 'name email');
  if (!order) throw new ApiError(404, "Order not found");

  // Update fields
  order.status = status;
  if (trackingCompany !== undefined) order.trackingCompany = trackingCompany;
  if (trackingLink !== undefined) order.trackingLink = trackingLink;
  if (trackingId !== undefined) order.trackingId = trackingId;
  await order.save();

  const customerEmail = order.user?.email || order.guest?.email;
  const customerName = order.user?.name || order.guest?.name || 'Valued Customer';
  const shortOrderId = String(order._id).slice(-6).toUpperCase();

  // Generate dynamic tracking HTML
  let trackingHtml = '';
  if (order.trackingCompany || order.trackingLink || order.trackingId) {
    trackingHtml = `
      <div style="background:#f0fdfa;border-radius:10px;padding:16px;margin-bottom:14px;border:1px solid #ccfbf1;text-align:left;">
        <h3 style="margin:0 0 12px 0;font-size:13px;color:#007074;text-transform:uppercase;letter-spacing:1px;">Tracking Information</h3>
        
        ${order.trackingCompany ? `<p style="margin:0 0 8px 0;font-size:13px;color:#444;"><b>Courier:</b> ${order.trackingCompany}</p>` : ''}
        
        ${order.trackingId ? `
          <div style="margin: 12px 0;">
            <p style="margin:0 0 4px 0;font-size:12px;color:#666;">Tracking Number:</p>
            <div style="background:#fff;border:1px dashed #2dd4bf;padding:8px 12px;border-radius:6px;display:inline-block;font-family:monospace;font-size:16px;color:#007074;font-weight:bold;letter-spacing:1px;">
              ${order.trackingId}
            </div>
            <p style="font-size:10px;color:#999;margin-top:4px;font-style:italic;">(Highlight to copy)</p>
          </div>
        ` : ''}

        ${order.trackingLink ? `<div style="margin-top: 14px;"><a href="${order.trackingLink}" target="_blank" style="background:#007074;color:#fff;padding:8px 16px;text-decoration:none;border-radius:6px;font-size:12px;font-weight:bold;display:inline-block;">Track Package Online</a></div>` : ''}
      </div>
    `;
  }

  // Send the email notification
  if (customerEmail) {
    try {
      await sendEmail({
        email: customerEmail,
        subject: `Stylogist - Order #${shortOrderId} Update`,
        message: `
          <div style="background:#f9fafb;padding:15px;font-family:Arial,Helvetica,sans-serif">
            <div style="max-width:720px;margin:auto;background:#fff;border-radius:14px;border:1px solid #eee;overflow:hidden">
              <div style="height:4px;background:linear-gradient(to right,#007074,#2dd4bf,#007074)"></div>
              <div style="padding:18px">
                

                <div style="text-align:center">
                  <h2 style="font-size:18px;font-weight:800;color:#222;margin-bottom:6px">Order Update</h2>
                  <p style="color:#666;font-size:12px;line-height:1.4;margin-bottom:16px">
                    Hello <b>${customerName}</b>, the status of your order <b>#${shortOrderId}</b> has been updated.
                  </p>

                  <div style="background:#f3f4f6;border-radius:10px;padding:14px;margin-bottom:14px;border:1px dashed #007074">
                    <p style="font-size:11px;color:#999;margin:0 0 5px 0;text-transform:uppercase;letter-spacing:1px">Current Status</p>
                    <span style="font-size:22px;font-weight:900;letter-spacing:4px;color:#007074;font-family:monospace;text-transform:uppercase">
                      ${status}
                    </span>
                  </div>
                  
                  ${trackingHtml}
                  
                </div>

                <div style="border-top:1px solid #eee;padding-top:12px">
                  <p style="color:#999;font-size:11px;line-height:1.4;text-align:center">
                    Thank you for shopping with us! If you have any questions, please contact our customer support.
                  </p>
                </div>
              </div>

              <div style="background:#222;padding:12px;text-align:center">
                <p style="color:#fff;font-size:9px;font-weight:700;letter-spacing:1px;margin-bottom:4px">Stylogist</p>
                <p style="color:#777;font-size:9px">Bahawalpur • Pakistan</p>
              </div>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error(`[Order Update] Failed to send email to ${customerEmail}:`, error);
    }
  }

  return order.toObject();
};