import { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { useLocation, useNavigation } from 'react-router-dom';

// Pairs a top-of-page progress bar with a gentle overlay on route change.
// The progress bar reflects *any* in-flight react-query fetch so page data
// transitions feel instant without a white flash, while the overlay fires
// only on actual navigation (useNavigation) so it doesn't cover the UI
// during background refetches.
export default function RouteLoader() {
  const location = useLocation();
  const navigation = useNavigation?.();
  const isFetching = useIsFetching();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isFetching > 0) {
      setVisible(true);
      setProgress(70);
      return undefined;
    }
    if (!visible) return undefined;
    setProgress(100);
    const t = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 280);
    return () => clearTimeout(t);
  }, [isFetching, visible]);

  // Scroll to top on route change so the spinner overlay doesn't pop up mid-page.
  useEffect(() => {
    setProgress(15);
  }, [location.pathname]);

  const loading = navigation?.state === 'loading';

  return (
    <>
      {(visible || loading) && (
        <div
          className="route-progress"
          style={{ width: `${progress}%`, opacity: progress === 0 ? 0 : 1 }}
        />
      )}
      {loading && (
        <div className="route-loader" aria-live="polite" role="status">
          <div className="brand-spinner" aria-label="Loading">
            <span className="brand-spinner__halo" />
            <svg
              className="brand-spinner__arc brand-spinner__arc--outer"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="route-loader-outer" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7FD4D7" />
                  <stop offset="55%" stopColor="#0a8c91" />
                  <stop offset="100%" stopColor="#007074" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(0,112,116,0.12)" strokeWidth="4" />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="url(#route-loader-outer)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="120 210"
              />
            </svg>
            <svg
              className="brand-spinner__arc brand-spinner__arc--inner"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#0a8c91"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="40 200"
                opacity="0.8"
              />
            </svg>
            <span className="brand-spinner__glow" />
            <img src="/logo.png" alt="" className="brand-spinner__logo" />
          </div>
        </div>
      )}
    </>
  );
}
