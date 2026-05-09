import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { bootstrapAnalytics, trackPageView } from "../utils/analytics";

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    });

    // Bootstrap GA4 (idempotent) and report the SPA route change as a
    // page_view event. We intentionally fire AFTER scroll-to-top so the
    // GA4 viewport metrics reflect the new page, not the previous
    // scroll position. No-ops if VITE_GA_MEASUREMENT_ID isn't set.
    bootstrapAnalytics();
    trackPageView(`${pathname}${search || ''}`);
  }, [pathname, search]);

  return null;
}