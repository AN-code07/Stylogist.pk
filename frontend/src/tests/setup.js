import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./msw/server.js";

// MSW lifecycle. Throwing on unhandled requests forces every test that
// triggers a network call to declare a handler — silent fall-throughs
// are how flaky tests start. Add overrides per-test with server.use().
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  // Reset MSW request handlers between tests so per-test overrides don't
  // leak into the next case. RTL's cleanup removes mounted components.
  server.resetHandlers();
  cleanup();
  // Wipe persisted zustand state so cart/wishlist/auth tests start clean.
  if (typeof localStorage !== "undefined") localStorage.clear();
});
afterAll(() => server.close());

// jsdom doesn't ship IntersectionObserver — several home-page components
// (ScrollReveal, lazy images) rely on it. Provide a no-op shim so they
// don't throw on mount.
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.IntersectionObserver = MockIntersectionObserver;

// matchMedia is referenced by the brand spinner + footer reduced-motion
// guard. Default to "no match" so animations are enabled in tests.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// scrollTo is called by ScrollToTop on route change; jsdom doesn't implement it.
if (typeof window !== "undefined" && !window.scrollTo) {
  window.scrollTo = () => {};
}
