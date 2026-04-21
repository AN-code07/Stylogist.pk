import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    sku: { type: String, required: true }, // track variant SKU
  },
  { _id: false }
);

const guestInfoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const inlineAddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home", trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Registered-customer orders: `user` populated, `guest` empty.
    // Guest orders: `user` null, `guest` + `guestAddress` populated.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    guest: { type: guestInfoSchema, default: undefined },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    // Reference shipping address — only set for registered customers.
    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      default: null,
    },

    // Snapshot address captured at checkout time for guest orders (so the
    // order record stays self-contained even if the customer never signs up).
    guestAddress: { type: inlineAddressSchema, default: undefined },

    paymentMethod: {
      type: String,
      enum: ["COD"],
      default: "COD",
    },

    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

// Optional: populate user and address automatically in queries
orderSchema.pre(/^find/, function () {
  this.populate("user", "name email").populate("shippingAddress");
});

const Order = mongoose.model("Order", orderSchema);

export default Order;