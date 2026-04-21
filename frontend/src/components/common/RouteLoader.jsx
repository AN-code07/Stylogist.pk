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
          <div className="flex flex-col items-center gap-5">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-[2.5px] border-[#007074]/10" />
              <div className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-[#007074] border-r-[#0a8c91] brand-ring" />
              <div className="absolute inset-[14%] rounded-full bg-white shadow-[0_8px_20px_rgba(0,112,116,0.15)] flex items-center justify-center">
                <img src="/logo.png" alt="" className="w-[72%] h-[72%] object-contain" draggable={false} />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] tracking-[0.4em] uppercase text-[#007074] font-semibold">
                Loading
              </span>
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#007074] brand-dot brand-dot--1" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0a8c91] brand-dot brand-dot--2" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#7FD4D7] brand-dot brand-dot--3" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
