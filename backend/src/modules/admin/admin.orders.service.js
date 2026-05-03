import mongoose from "mongoose";
import Order from "../orders/order.model.js";
import { User } from "../users/user.model.js";
import { Variant } from "../products/variant.model.js";
import { Product } from "../products/product.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendEmail } from '../../utils/email.js';

const VALID_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "partially_shipped",
  "delivered",
  "cancelled",
  "returned",
];

const fmtPKR = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;

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

  // Search: matches against customer name/email/phone AND the order id —
  // both the full 24-char ObjectId (if pasted) and the visible 6-char tail
  // shown in the UI (#A1B2C3). `_id` is an ObjectId, so we have to stringify
  // it via $expr + $toString to run a regex against it.
  if (search) {
    const trimmed = search.trim();
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(escaped, "i");
    const or = [];

    // Customer matches
    const userIds = await User.find({
      $or: [{ name: rx }, { email: rx }, { phone: rx }],
    }).distinct("_id");
    if (userIds.length) or.push({ user: { $in: userIds } });

    // Order id matches — supports full id or any hex substring (tail / prefix).
    if (/^[0-9a-fA-F]+$/.test(trimmed)) {
      // Full 24-char ObjectId — direct equality is cheaper than $expr.
      if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
        or.push({ _id: trimmed });
      }
      // Hex substring (e.g. last 6 of #A1B2C3) — match against the
      // string form of _id. Anchored to end of id so trailing-tail searches
      // are stable; falls back to anywhere-in-id otherwise.
      if (trimmed.length >= 4) {
        or.push({
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: escaped,
              options: "i",
            },
          },
        });
      }
    }

    // No matchable predicate (e.g. empty search after trimming) — leave the
    // filter unconstrained instead of returning zero rows for everything.
    if (or.length) filter.$or = or;
  }

  const pageNum = Math.max(Number(page), 1);
  const pageSize = Math.min(Math.max(Number(limit), 1), 100);

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

const renderItemsBlock = (heading, accent, items) => {
  if (!items.length) return "";
  const rows = items
    .map(
      (it) => `
        <tr>
          <td style="padding:8px 6px;font-size:13px;color:#222;border-bottom:1px solid #f0f0f0;">
            <div style="font-weight:600;">${it.name}</div>
            <div style="font-size:11px;color:#888;">SKU ${it.sku} · qty ${it.quantity}</div>
          </td>
          <td style="padding:8px 6px;font-size:13px;color:#222;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">
            ${fmtPKR(it.subtotal ?? it.price * it.quantity)}
          </td>
        </tr>`
    )
    .join("");
  return `
    <div style="background:#fff;border:1px solid #e9e9e9;border-radius:10px;padding:14px;margin-bottom:14px;">
      <h3 style="margin:0 0 10px 0;font-size:13px;color:${accent};text-transform:uppercase;letter-spacing:1px;">
        ${heading} (${items.length})
      </h3>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>${rows}</tbody>
      </table>
    </div>`;
};

const renderTrackingBlock = (order) => {
  if (!order.trackingCompany && !order.trackingLink && !order.trackingId) return "";
  return `
    <div style="background:#f0fdfa;border-radius:10px;padding:16px;margin-bottom:14px;border:1px solid #ccfbf1;text-align:left;">
      <h3 style="margin:0 0 12px 0;font-size:13px;color:#007074;text-transform:uppercase;letter-spacing:1px;">Tracking Information</h3>
      ${order.trackingCompany ? `<p style="margin:0 0 8px 0;font-size:13px;color:#444;"><b>Courier:</b> ${order.trackingCompany}</p>` : ''}
      ${order.trackingId ? `
        <div style="margin:12px 0;">
          <p style="margin:0 0 4px 0;font-size:12px;color:#666;">Tracking Number:</p>
          <div style="background:#fff;border:1px dashed #2dd4bf;padding:8px 12px;border-radius:6px;display:inline-block;font-family:monospace;font-size:16px;color:#007074;font-weight:bold;letter-spacing:1px;">
            ${order.trackingId}
          </div>
        </div>
      ` : ''}
      ${order.trackingLink ? `<div style="margin-top:14px;"><a href="${order.trackingLink}" target="_blank" style="background:#007074;color:#fff;padding:8px 16px;text-decoration:none;border-radius:6px;font-size:12px;font-weight:bold;display:inline-block;">Track Package Online</a></div>` : ''}
    </div>`;
};

const renderStatusEmail = ({ order, status, customerName, shortOrderId }) => {
  const shipped = (order.items || []).filter((i) => i.shipped);
  const pending = (order.items || []).filter((i) => !i.shipped);

  // Only the shipping-related transitions get the per-item breakdown — the
  // rest fall back to the original concise template.
  const isShipTransition = status === "shipped" || status === "partially_shipped";
  const greetingLine = isShipTransition
    ? status === "shipped"
      ? "Great news — every item in your order has been dispatched."
      : "Part of your order has been dispatched. The remaining items are still being prepared."
    : `The status of your order <b>#${shortOrderId}</b> has been updated.`;

  const itemsSection = isShipTransition
    ? `
      ${renderItemsBlock("Shipped now", "#007074", shipped)}
      ${renderItemsBlock("Still pending", "#b45309", pending)}
    `
    : "";

  return `
    <div style="background:#f9fafb;padding:15px;font-family:Arial,Helvetica,sans-serif">
      <div style="max-width:720px;margin:auto;background:#fff;border-radius:14px;border:1px solid #eee;overflow:hidden">
        <div style="height:4px;background:linear-gradient(to right,#007074,#2dd4bf,#007074)"></div>
        <div style="padding:18px">
          <div style="text-align:center">
            <h2 style="font-size:18px;font-weight:800;color:#222;margin-bottom:6px">Order Update</h2>
            <p style="color:#666;font-size:12px;line-height:1.4;margin-bottom:16px">
              Hello <b>${customerName}</b>, ${greetingLine}
            </p>

            <div style="background:#f3f4f6;border-radius:10px;padding:14px;margin-bottom:14px;border:1px dashed #007074">
              <p style="font-size:11px;color:#999;margin:0 0 5px 0;text-transform:uppercase;letter-spacing:1px">Current Status</p>
              <span style="font-size:22px;font-weight:900;letter-spacing:4px;color:#007074;font-family:monospace;text-transform:uppercase">
                ${status.replace(/_/g, " ")}
              </span>
            </div>

            ${itemsSection}
            ${renderTrackingBlock(order)}
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
    </div>`;
};

export const updateOrderStatus = async (id, status, trackingCompany, trackingLink, trackingId, shippedItemIndexes) => {
  if (!VALID_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status. Use one of: ${VALID_STATUSES.join(", ")}`);
  }

  const order = await Order.findById(id).populate('user', 'name email');
  if (!order) throw new ApiError(404, "Order not found");

  if (trackingCompany !== undefined) order.trackingCompany = trackingCompany;
  if (trackingLink !== undefined) order.trackingLink = trackingLink;
  if (trackingId !== undefined) order.trackingId = trackingId;

  // Apply per-item shipping selection when transitioning into a shipped
  // state. The admin can mark a subset of items; the order-level status is
  // promoted to "shipped" only if everything is now shipped, otherwise it
  // settles into the partial state.
  let derivedStatus = status;
  if (status === "shipped" || status === "partially_shipped") {
    const total = order.items.length;
    const indexes = Array.isArray(shippedItemIndexes) ? shippedItemIndexes : null;

    order.items.forEach((item, idx) => {
      // Explicit selection wins. If no selection was sent and the admin
      // chose "shipped" outright, treat all items as shipped.
      const willShip = indexes
        ? indexes.includes(idx)
        : status === "shipped";

      if (willShip && !item.shipped) {
        item.shipped = true;
        item.shippedAt = new Date();
      }
      if (!willShip && status === "partially_shipped") {
        // Don't unship items that were previously marked. Partial shipments
        // are additive — once dispatched, an item stays dispatched.
      }
    });

    const shippedCount = order.items.filter((i) => i.shipped).length;
    if (shippedCount === 0) {
      throw new ApiError(400, "Select at least one item to mark as shipped.");
    }
    derivedStatus = shippedCount === total ? "shipped" : "partially_shipped";
  } else {
    // Non-shipping transitions: clear per-item flags only on cancel/return so
    // the customer-facing breakdown stays consistent.
    if (status === "cancelled" || status === "returned") {
      // Leave shipped flags alone — they reflect history.
    }
  }

  order.status = derivedStatus;
  await order.save();

  const customerEmail = order.user?.email || order.guest?.email;
  const customerName = order.user?.name || order.guest?.name || 'Valued Customer';
  const shortOrderId = String(order._id).slice(-6).toUpperCase();

  if (customerEmail) {
    try {
      await sendEmail({
        email: customerEmail,
        subject: `Stylogist - Order #${shortOrderId} Update`,
        message: renderStatusEmail({
          order,
          status: derivedStatus,
          customerName,
          shortOrderId,
        }),
      });
    } catch (error) {
      console.error(`[Order Update] Failed to send email to ${customerEmail}:`, error);
    }
  }

  return order.toObject();
};

// Sanitize a free-form admin payload into a single, fully-validated
// patch the order can absorb. Designed to be called from a single
// `PATCH /admin/orders/:id` endpoint so the admin UI can submit any
// subset of editable fields in one request.
//
// Editable fields:
//   - items[]         — add / remove / change quantity (price is preserved
//                       on existing rows; new rows resolve their price
//                       from the live Variant + Product snapshot)
//   - shippingFee     — flat fee adjustment
//   - guest           — name / email / phone for guest orders
//   - guestAddress    — full address snapshot (works for *both* guest and
//                       registered orders; converts a registered order to
//                       a snapshot when the admin edits the address)
//   - status / tracking fields are still owned by updateOrderStatus.
export const editOrder = async (id, patch = {}) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid order id");

  const order = await Order.findById(id).populate("user", "name email");
  if (!order) throw new ApiError(404, "Order not found");

  // ── ITEMS ─────────────────────────────────────────────────────────
  // Authoritative replace when an `items` array is supplied. Each row
  // must reference an existing Product + Variant SKU so we can lock in
  // a fresh price snapshot for new lines.
  if (Array.isArray(patch.items)) {
    if (!patch.items.length) {
      throw new ApiError(400, "An order must have at least one item.");
    }

    const nextItems = [];
    for (const [idx, raw] of patch.items.entries()) {
      const productId = raw?.product;
      const sku = (raw?.sku || "").toString().trim();
      const quantity = Number(raw?.quantity);

      if (!mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, `Item ${idx + 1}: invalid product id`);
      }
      if (!sku) throw new ApiError(400, `Item ${idx + 1}: SKU is required`);
      if (!Number.isFinite(quantity) || quantity < 1) {
        throw new ApiError(400, `Item ${idx + 1}: quantity must be ≥ 1`);
      }

      // Reuse the existing line when the product+SKU pair matches —
      // preserves the original price + shipped flag (admins editing an
      // already-dispatched order shouldn't lose dispatch history).
      const existing = order.items.find(
        (it) => String(it.product) === String(productId) && it.sku === sku
      );

      if (existing) {
        const price = Number(existing.price);
        nextItems.push({
          product: existing.product,
          name: existing.name,
          sku: existing.sku,
          price,
          quantity,
          subtotal: price * quantity,
          shipped: !!existing.shipped,
          shippedAt: existing.shippedAt || null,
        });
        continue;
      }

      // New line — pull current price + name from the live catalogue.
      const [variant, product] = await Promise.all([
        Variant.findOne({ product: productId, sku }).lean(),
        Product.findById(productId).select("name").lean(),
      ]);
      if (!variant) throw new ApiError(404, `Item ${idx + 1}: SKU ${sku} not found on the product`);
      if (!product) throw new ApiError(404, `Item ${idx + 1}: product not found`);
      if (variant.stock != null && variant.stock < quantity) {
        throw new ApiError(409, `Item ${idx + 1}: only ${variant.stock} in stock`);
      }

      const price = Number(variant.salePrice);
      nextItems.push({
        product: product._id,
        name: product.name,
        sku: variant.sku,
        price,
        quantity,
        subtotal: price * quantity,
        shipped: false,
        shippedAt: null,
      });
    }

    order.items = nextItems;
  }

  // ── SHIPPING FEE ──────────────────────────────────────────────────
  if (patch.shippingFee !== undefined) {
    const fee = Number(patch.shippingFee);
    if (!Number.isFinite(fee) || fee < 0) {
      throw new ApiError(400, "Shipping fee must be a non-negative number");
    }
    order.shippingFee = fee;
  }

  // ── GUEST CONTACT (name / email / phone) ──────────────────────────
  // We allow editing the guest block on registered orders too — admins
  // sometimes need to override the contact for a delivery without
  // touching the customer's own profile. The user link stays intact.
  if (patch.guest && typeof patch.guest === "object") {
    const { name, email, phone } = patch.guest;
    const next = {
      name: (name ?? order.guest?.name ?? order.user?.name ?? "").toString().trim(),
      email: (email ?? order.guest?.email ?? order.user?.email ?? "").toString().trim().toLowerCase(),
      phone: (phone ?? order.guest?.phone ?? "").toString().trim(),
    };
    if (!next.name) throw new ApiError(400, "Customer name is required");
    if (!next.email) throw new ApiError(400, "Customer email is required");
    if (!next.phone) throw new ApiError(400, "Customer phone is required");
    order.guest = next;
  }

  // ── ADDRESS SNAPSHOT ──────────────────────────────────────────────
  // `guestAddress` is the inline, self-contained snapshot. Editing it
  // works for both guest and registered orders; for the latter we also
  // null the `shippingAddress` ref so the snapshot becomes the source
  // of truth (the customer's saved address is never mutated from here).
  if (patch.guestAddress && typeof patch.guestAddress === "object") {
    const a = patch.guestAddress;
    const required = ["addressLine1", "city", "state", "postalCode", "country"];
    for (const key of required) {
      if (!(a[key] || "").toString().trim()) {
        throw new ApiError(400, `Address field "${key}" is required`);
      }
    }
    order.guestAddress = {
      label: (a.label || "Home").toString().trim(),
      addressLine1: a.addressLine1.toString().trim(),
      addressLine2: (a.addressLine2 || "").toString().trim(),
      city: a.city.toString().trim(),
      state: a.state.toString().trim(),
      postalCode: a.postalCode.toString().trim(),
      country: a.country.toString().trim(),
    };
    order.shippingAddress = null;
  }

  // ── RECOMPUTE TOTALS ─────────────────────────────────────────────
  // Always re-derive from the current items + shippingFee. This keeps
  // the persisted totals coherent regardless of which fields the admin
  // touched in this patch.
  const subtotal = order.items.reduce(
    (sum, it) => sum + Number(it.subtotal ?? it.price * it.quantity),
    0
  );
  order.subtotal = subtotal;
  order.totalAmount = subtotal + Number(order.shippingFee || 0);

  await order.save();
  return order.toObject();
};
