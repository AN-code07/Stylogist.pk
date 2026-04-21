import { useEffect, useState } from 'react';
import logo from '/logo.png';

// Full-screen first-paint loader. Mirrors the pattern we use in the
// portfolio project: holds for a minimum duration so the fade-in → spin →
// fade-out feels intentional rather than flashy, then steps aside when the
// window `load` event fires (or after a hard 3.5s fallback so a stalled
// asset never traps the user). Body scroll is locked while visible.
export default function PageLoader() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const MIN_DURATION = 700;

    const finish = () => {
      const elapsed = performance.now() - start;
      const wait = Math.max(0, MIN_DURATION - elapsed);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setLoading(false), 450);
      }, wait);
    };

    if (document.readyState === 'complete') {
      finish();
    } else {
      window.addEventListener('load', finish, { once: true });
      const fallback = setTimeout(finish, 3500);
      return () => {
        window.removeEventListener('load', finish);
        clearTimeout(fallback);
      };
    }
  }, []);

  useEffect(() => {
    if (loading) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [loading]);

  if (!loading) return null;

  return (
    <div
      aria-hidden={fadeOut}
      role="status"
      aria-label="Loading Stylogist"
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#FDFDFD] transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Ambient teal glows — set the brand mood without stealing focus. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[420px] h-[420px] bg-[#007074] rounded-full blur-[180px] opacity-[0.08]" />
        <div className="absolute bottom-1/3 right-1/3 w-[340px] h-[340px] bg-[#7FD4D7] rounded-full blur-[160px] opacity-[0.10]" />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        {/* Logo ring: dim static track behind, teal+bright-teal rotating arc in front. */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-[2.5px] border-[#007074]/10" />
          <div className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-[#007074] border-r-[#0a8c91] brand-ring" />
          <div className="absolute inset-[14%] rounded-full bg-white shadow-[0_8px_24px_rgba(0,112,116,0.15)] flex items-center justify-center">
            <img
              src={logo}
              alt=""
              className="w-[72%] h-[72%] object-contain"
              draggable={false}
            />
          </div>
        </div>

        {/* Label + bouncing dots */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[11px] tracking-[0.4em] uppercase text-[#007074] font-semibold">
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
  );
}
