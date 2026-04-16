import slugify from "slugify";

// Generates a URL-safe slug that is unique within the given Mongoose collection.
// Retries with a numeric suffix (-1, -2, ...) until it finds a free one.
// `excludeId` lets callers (e.g. update flows) ignore the doc being edited
// so an unchanged slug is not considered a conflict with itself.
export const generateUniqueSlug = async (Model, source, excludeId = null) => {
  if (!source || typeof source !== "string") {
    throw new Error("generateUniqueSlug requires a non-empty string source");
  }

  const base = slugify(source, { lower: true, strict: true, trim: true });
  if (!base) throw new Error("Could not derive a slug from the provided source");

  let candidate = base;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const filter = { slug: candidate };
    if (excludeId) filter._id = { $ne: excludeId };

    const existing = await Model.exists(filter);
    if (!existing) return candidate;

    candidate = `${base}-${counter}`;
    counter += 1;
  }
};
