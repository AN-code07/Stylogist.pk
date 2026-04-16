import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    level: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Note: slug generation is now owned by the service layer via `utils/slug.js`
// so it is consistent with Brand and Product and can handle update flows
// (where we need to exclude the document being edited from the uniqueness check).

export const Category = mongoose.model("Category", categorySchema);
