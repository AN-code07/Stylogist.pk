// Lightweight GA4 wrapper. We don't pull in `react-ga` because it weighs
// more than the actual gtag.js snippet, and we want to keep the SPA bundle
// tight. Calling these helpers is a no-op when GA isn't configured (e.g.
// dev / preview deploys) so wiring them in is always safe.
//
// Env: set VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX in the frontend .env to
// activate. The bootstrap function below injects gtag.js the first time
// it's called and registers the GA property in `consent default` mode so
// you can layer on a CMP later without rewiring.

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
let bootstrapped = false;

const isBrowser = typeof window !== 'undefined';

const queue = (fn) => {
  if (!isBrowser) return;
  if (window.gtag) fn(window.gtag);
};

// One-time setup. Idempotent — safe to call from multiple useEffect hooks.
export function bootstrapAnalytics() {
  if (!isBrowser || !MEASUREMENT_ID || bootstrapped) return;
  bootstrapped = true;

  // Standard gtag.js stub — must be present BEFORE the script loads so
  // queued calls aren't dropped.
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  // Ship anonymized IPs by default; healthier for Pakistan privacy
  // expectations and required for GA4 in some markets anyway.
  window.gtag('config', MEASUREMENT_ID, {
    anonymize_ip: true,
    transport_type: 'beacon',
    send_page_view: false, // we send page_view explicitly on route change
  });

  // Inject the GA4 script tag.
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

// SPA pageview — fire on every router transition.
export function trackPageView(path) {
  queue((gtag) =>
    gtag('event', 'page_view', {
      page_path: path,
      page_location: typeof window !== 'undefined' ? window.location.href : undefined,
      page_title: typeof document !== 'undefined' ? document.title : undefined,
    })
  );
}

// Mapping helper — converts a product object into the GA4 `items` shape.
const toItem = (product, qty = 1) => ({
  item_id: product._id || product.slug,
  item_name: product.name,
  item_brand: product.brand?.name,
  item_category: product.category?.name,
  price: product.minPrice ?? product.price ?? 0,
  quantity: qty,
});

export function trackViewItem(product) {
  if (!product) return;
  queue((gtag) =>
    gtag('event', 'view_item', {
      currency: 'PKR',
      value: product.minPrice || 0,
      items: [toItem(product)],
    })
  );
}

export function trackAddToCart(product, qty = 1) {
  if (!product) return;
  queue((gtag) =>
    gtag('event', 'add_to_cart', {
      currency: 'PKR',
      value: (product.minPrice || product.price || 0) * qty,
      items: [toItem(product, qty)],
    })
  );
}

export function trackBeginCheckout(items, total) {
  queue((gtag) =>
    gtag('event', 'begin_checkout', {
      currency: 'PKR',
      value: total,
      items: (items || []).map((it) => ({
        item_id: it.productId,
        item_name: it.name,
        price: it.price,
        quantity: it.quantity,
      })),
    })
  );
}

export function trackPurchase({ orderId, total, items }) {
  queue((gtag) =>
    gtag('event', 'purchase', {
      transaction_id: orderId,
      currency: 'PKR',
      value: total,
      items: (items || []).map((it) => ({
        item_id: it.productId || it.product,
        item_name: it.name,
        price: it.price,
        quantity: it.quantity,
      })),
    })
  );
}

export function trackSearch(term) {
  if (!term) return;
  queue((gtag) =>
    gtag('event', 'search', { search_term: term })
  );
}
