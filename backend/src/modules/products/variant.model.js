import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
    },

    // size doubles as the customer-facing label ("Small", "30 capsules").
    // packSize captures the numeric quantity so we can sort/filter on it.
    size: String,
    packSize: { type: String, trim: true, default: "" },
    color: String,

    // Per-variant strength / dosage label. Free-form because supplements
    // express potency in different units (1000mg, 5000 IU, 2.5 billion CFU,
    // 50% extract). Indexed via the variants table on the storefront PDP
    // so shoppers can compare strengths at a glance. The product-level
    // `ingredients` reference list (Ingredient[]) is unchanged — that's the
    // structured taxonomy used for filtering. Potency is the human label.
    potency: { type: String, trim: true, default: "" },

    originalPrice: {
      type: Number,
      required: true,
    },

    salePrice: {
      type: Number,
      required: true,
    },

    discountPercentage: Number,

    stock: {
      type: Number,
      required: true,
    },

    weight: Number,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    // strict:false kept so legacy documents that still carry `material` /
    // `ingredients` text fields continue to deserialize without erroring.
    // Those fields are no longer authored — `potency` replaces them — but
    // we don't want a hard migration to break older catalogue rows.
    strict: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const Variant = mongoose.model("Variant", variantSchema);
