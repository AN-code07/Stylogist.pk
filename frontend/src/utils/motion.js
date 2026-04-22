export const fadeUp = (visible) =>
  visible
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-10";

export const fadeLeft = (visible) =>
  visible
    ? "opacity-100 translate-x-0"
    : "opacity-0 -translate-x-10";

export const fadeRight = (visible) =>
  visible
    ? "opacity-100 translate-x-0"
    : "opacity-0 translate-x-10";