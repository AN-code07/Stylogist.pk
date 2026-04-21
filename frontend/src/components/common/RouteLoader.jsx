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
            <span className="brand-spinner__ring" />
            <span className="brand-spinner__mark">S</span>
          </div>
        </div>
      )}
    </>
  );
}
