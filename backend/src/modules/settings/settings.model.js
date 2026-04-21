import mongoose from "mongoose";

// Singleton document: there is only ever one SiteSettings row. We key it
// with a fixed `key: "site"` + unique index so repeated upserts always
// touch the same record regardless of instance/host.
const linkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const socialSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    label: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const paymentBadgeSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    tone: { type: String, enum: ["neutral", "accent"], default: "neutral" },
  },
  { _id: false }
);

// "Meet the Visionaries" — team/leadership cards rendered on the About
// page. Admin-editable list with photo, name, role, and an optional bio.
const visionarySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    bio: { type: String, default: "", trim: true },
    image: { type: String, default: "", trim: true },
    socialUrl: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "site", unique: true, index: true },

    footer: {
      brandTagline: {
        type: String,
        trim: true,
        default:
          "Your ultimate destination for premium fashion, curated by AI and tailored for the modern, sophisticated lifestyle. Elevate your everyday elegance.",
      },
      address: { type: String, trim: true, default: "Stylogist HQ, Fashion Avenue, Pakistan" },
      phone: { type: String, trim: true, default: "+92 300 123 4567" },
      email: { type: String, trim: true, default: "support@stylogist.pk" },

      shopLinks: { type: [linkSchema], default: undefined },
      customerCareLinks: { type: [linkSchema], default: undefined },
      legalLinks: { type: [linkSchema], default: undefined },
      socials: { type: [socialSchema], default: undefined },
      paymentBadges: { type: [paymentBadgeSchema], default: undefined },

      newsletterHeading: { type: String, trim: true, default: "Join The Insider Club" },
      newsletterBlurb: {
        type: String,
        trim: true,
        default:
          "Subscribe to our newsletter and get 10% off your first premium purchase, plus early access to new drops.",
      },

      copyright: {
        type: String,
        trim: true,
        default: "Stylogist.pk. All Rights Reserved.",
      },
    },

    about: {
      visionHeading: { type: String, trim: true, default: "Meet the Visionaries" },
      visionBlurb: {
        type: String,
        trim: true,
        default:
          "The people behind Stylogist — pairing design, technology, and craftsmanship to curate a better way to shop.",
      },
      visionaries: { type: [visionarySchema], default: undefined },
    },
  },
  { timestamps: true }
);

export const SiteSettings = mongoose.model("SiteSettings", settingsSchema);

// Hardcoded defaults used when the document is missing or a field is blank.
// We keep them here (not in the schema) so the Footer UI still has sensible
// copy the very first time the admin loads the site.
export const DEFAULT_FOOTER = {
  brandTagline:
    "Your ultimate destination for premium fashion, curated by AI and tailored for the modern, sophisticated lifestyle. Elevate your everyday elegance.",
  address: "Stylogist HQ, Fashion Avenue, Pakistan",
  phone: "+92 300 123 4567",
  email: "support@stylogist.pk",
  shopLinks: [
    { label: "Women's Collection", path: "/category" },
    { label: "Men's Collection", path: "/category" },
    { label: "Luxury Accessories", path: "/category" },
    { label: "Premium Footwear", path: "/category" },
    { label: "Hot Deals", path: "/deals" },
  ],
  customerCareLinks: [
    { label: "My Account", path: "/profile" },
    { label: "Track Order", path: "/track-order" },
    { label: "Shipping & Delivery", path: "/shipping" },
    { label: "Returns & Exchanges", path: "/returns" },
    { label: "Size Guide", path: "/size-guide" },
    { label: "FAQs", path: "/faq" },
  ],
  legalLinks: [
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Terms of Service", path: "/terms" },
  ],
  socials: [
    { platform: "instagram", url: "https://instagram.com/stylogist.pk", label: "Instagram" },
    { platform: "facebook", url: "https://facebook.com/stylogist.pk", label: "Facebook" },
    { platform: "twitter", url: "https://twitter.com/stylogist_pk", label: "Twitter / X" },
  ],
  paymentBadges: [
    { label: "Visa", tone: "neutral" },
    { label: "Mastercard", tone: "neutral" },
    { label: "Cash on Delivery", tone: "accent" },
  ],
  newsletterHeading: "Join The Insider Club",
  newsletterBlurb:
    "Subscribe to our newsletter and get 10% off your first premium purchase, plus early access to new drops.",
  copyright: "Stylogist.pk. All Rights Reserved.",
};

export const DEFAULT_ABOUT = {
  visionHeading: "Meet the Visionaries",
  visionBlurb:
    "The people behind Stylogist — pairing design, technology, and craftsmanship to curate a better way to shop.",
  visionaries: [],
};
