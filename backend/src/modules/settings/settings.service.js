import { SiteSettings, DEFAULT_FOOTER, DEFAULT_ABOUT } from "./settings.model.js";

// Public read: always resolves. If the singleton row is missing, we fall
// back to DEFAULT_* so the storefront never renders empty.
export const getPublicSettings = async () => {
  const doc = await SiteSettings.findOne({ key: "site" }).lean();
  const footer = doc?.footer || {};
  const about = doc?.about || {};
  return {
    footer: {
      brandTagline: footer.brandTagline || DEFAULT_FOOTER.brandTagline,
      address: footer.address || DEFAULT_FOOTER.address,
      phone: footer.phone || DEFAULT_FOOTER.phone,
      email: footer.email || DEFAULT_FOOTER.email,
      shopLinks: footer.shopLinks?.length ? footer.shopLinks : DEFAULT_FOOTER.shopLinks,
      customerCareLinks: footer.customerCareLinks?.length
        ? footer.customerCareLinks
        : DEFAULT_FOOTER.customerCareLinks,
      legalLinks: footer.legalLinks?.length ? footer.legalLinks : DEFAULT_FOOTER.legalLinks,
      socials: footer.socials?.length ? footer.socials : DEFAULT_FOOTER.socials,
      paymentBadges: footer.paymentBadges?.length
        ? footer.paymentBadges
        : DEFAULT_FOOTER.paymentBadges,
      newsletterHeading: footer.newsletterHeading || DEFAULT_FOOTER.newsletterHeading,
      newsletterBlurb: footer.newsletterBlurb || DEFAULT_FOOTER.newsletterBlurb,
      copyright: footer.copyright || DEFAULT_FOOTER.copyright,
    },
    about: {
      visionHeading: about.visionHeading || DEFAULT_ABOUT.visionHeading,
      visionBlurb: about.visionBlurb || DEFAULT_ABOUT.visionBlurb,
      visionaries: about.visionaries?.length ? about.visionaries : DEFAULT_ABOUT.visionaries,
    },
  };
};

// Admin write: partial update on the singleton document (upsert). The
// client sends only the sections it wants to change; we dot-path $set them
// in without clobbering the rest.
export const updateSettings = async (patch = {}) => {
  const $set = {};
  if (patch.footer && typeof patch.footer === "object") {
    Object.entries(patch.footer).forEach(([key, value]) => {
      $set[`footer.${key}`] = value;
    });
  }
  if (patch.about && typeof patch.about === "object") {
    Object.entries(patch.about).forEach(([key, value]) => {
      $set[`about.${key}`] = value;
    });
  }

  await SiteSettings.updateOne(
    { key: "site" },
    { $set, $setOnInsert: { key: "site" } },
    { upsert: true }
  );

  return getPublicSettings();
};
