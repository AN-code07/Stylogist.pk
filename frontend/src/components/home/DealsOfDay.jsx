import React, { useEffect, useState } from 'react';
import { FiChevronRight, FiZap, FiPackage, FiAlertCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useProducts } from '../../features/products/useProductHooks';
import StorefrontProductCard from '../common/StorefrontProductCard';

// Deals grid — live product list keyed to the admin-curated `isDeal` flag.
// Countdown timer resets at midnight so the "ends in" pressure stays
// meaningful across sessions without needing a server-side schedule.
export default function DealsOfDay() {
  const { data, isLoading, isError } = useProducts({
    deal: 'true',
    limit: 8,
    sort: 'priceLow',
  });
  const items = data?.items || [];

  const [timeLeft, setTimeLeft] = useState(() => secondsUntilMidnight());
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(secondsUntilMidnight()), 1000);
    return () => clearInterval(t);
  }, []);
  const { hrs, mins, secs } = formatTime(timeLeft);

  return (
    <section className="relative bg-[#FDFDFD] py-10 overflow-hidden border-t border-gray-50">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#007074]/5 blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between lg:mb-16 mb-8 gap-10">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-[#007074]/10 text-[#007074] text-[10px] font-black tracking-[0.2em] uppercase mb-4">
              <FiZap className="animate-pulse" /> Limited Availability
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-black text-[#222] tracking-tighter">
              Deals of the <span className="italic text-[#007074]">Day</span>
            </h2>
          </div>

          <div className="flex items-center justify-center gap-4 bg-white p-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-2">Ends In:</span>
            <div className="flex items-center gap-3">
              {[
                { val: hrs, label: 'HRS' },
                { val: mins, label: 'MIN' },
                { val: secs, label: 'SEC' },
              ].map((unit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-serif font-black text-[#222] leading-none">{unit.val}</div>
                    <div className="text-[8px] font-black text-[#007074] tracking-widest mt-1">{unit.label}</div>
                  </div>
                  {i < 2 && <div className="text-gray-200 text-xl font-light mb-4">:</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {isError ? (
          <FallbackState icon={<FiAlertCircle size={28} />} message="Couldn't load deals." />
        ) : isLoading ? (
          <SkeletonGrid count={4} />
        ) : items.length === 0 ? (
          <FallbackState
            icon={<FiPackage size={28} />}
            message="No deals running right now. Tag a product as On Deal in the admin dashboard to feature it here."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 lg:gap-10">
            {items.slice(0, 4).map((p, i) => (
              <StorefrontProductCard key={p._id} product={p} index={i} variant="deal" showStockBar />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/category?deal=true"
            className="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#222] hover:text-[#007074] transition-all group"
          >
            Discover All Active Deals
            <div className="w-8 h-[1px] bg-gray-200 group-hover:w-12 group-hover:bg-[#007074] transition-all duration-500" />
            <FiChevronRight className="group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function secondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

function formatTime(seconds) {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return { hrs, mins, secs };
}

function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[3/4] bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 w-1/3 bg-slate-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function FallbackState({ icon, message }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center text-slate-500 text-sm">
      <div className="mx-auto text-slate-300 mb-3 w-fit">{icon}</div>
      <p className="max-w-md mx-auto">{message}</p>
    </div>
  );
}
