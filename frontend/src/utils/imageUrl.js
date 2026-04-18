// Image URL resolver — handles the most common production breakage where
// backend stored `http://localhost:5000/uploads/...` during development.
// On a Vercel-hosted frontend those URLs 404, so we rewrite the host to
// whatever the API client is configured against.
//
// Set VITE_PUBLIC_ASSETS_URL in the frontend env if assets live on a CDN
// different from VITE_API_URL (which points at `/api/v1`).
const API_URL = import.meta.env.VITE_API_URL || '';
const ASSETS_URL =
  import.meta.env.VITE_PUBLIC_ASSETS_URL || API_URL.replace(/\/api\/v\d+\/?$/, '');

const FALLBACK = '/placeholder.svg';

export const resolveImageUrl = (src) => {
  if (!src) return FALLBACK;
  if (typeof src !== 'string') return FALLBACK;

  // Already an absolute, reachable URL (unsplash, cloudfront, etc.) — leave it.
  // But rewrite localhost so dev-time uploads render on deployed builds.
  if (/^https?:\/\//i.test(src)) {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(src) && ASSETS_URL) {
      return src.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, ASSETS_URL.replace(/\/$/, ''));
    }
    // Lighthouse "Best Practices" requires every asset served over HTTPS.
    // Upgrade any remaining http:// production URLs.
    if (/^http:\/\//i.test(src) && !/localhost|127\.0\.0\.1/.test(src)) {
      return src.replace(/^http:\/\//i, 'https://');
    }
    return src;
  }

  // Relative path (e.g. "/uploads/foo.webp") — prepend the backend host.
  if (src.startsWith('/') && ASSETS_URL) {
    return `${ASSETS_URL.replace(/\/$/, '')}${src}`;
  }
  return src;
};

export const productImageFallback = FALLBACK;
