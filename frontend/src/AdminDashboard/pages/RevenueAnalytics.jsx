import React, { useState } from 'react';
import {
  FiTrendingUp, FiArrowUpRight, FiArrowDownRight, FiPieChart,
  FiShoppingBag, FiBox, FiActivity, FiAlertCircle, FiRefreshCw
} from 'react-icons/fi';
import { useAnalytics } from '../../features/admin/useAdminHooks';

const TIMEFRAMES = [
  { id: '7D', label: '7 days' },
  { id: '30D', label: '30 days' },
  { id: '3M', label: '3 months' },
  { id: '1Y', label: '1 year' },
];

const fmtPKR = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;
const fmtCompact = (n) => {
  if (n == null) return 'Rs 0';
  if (n >= 1_000_000) return `Rs ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Rs ${(n / 1_000).toFixed(1)}K`;
  return `Rs ${Math.round(n)}`;
};

export default function RevenueAnalytics() {
  const [timeframe, setTimeframe] = useState('30D');
  const { data, isLoading, isError, refetch, isFetching } = useAnalytics(timeframe);

  const summary = data?.summary;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Revenue, orders, and category performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  timeframe === tf.id
                    ? 'bg-[#007074] text-white'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60"
            title="Refresh"
          >
            <FiRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <>
          {/* Metrics */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              title="Gross revenue"
              value={fmtPKR(summary?.grossRevenue)}
              growth={summary?.revenueGrowth}
              isGrowthGood
              icon={<FiTrendingUp />}
              loading={isLoading}
            />
            <MetricCard
              title="Total orders"
              value={(summary?.totalOrders ?? 0).toLocaleString()}
              growth={summary?.ordersGrowth}
              isGrowthGood
              icon={<FiShoppingBag />}
              loading={isLoading}
            />
            <MetricCard
              title="Est. net profit"
              value={fmtPKR(summary?.estimatedProfit)}
              growth={summary?.profitGrowth}
              isGrowthGood
              icon={<FiActivity />}
              hint="Approximated at 35% of gross"
              loading={isLoading}
            />
            <MetricCard
              title="Return rate"
              value={summary ? `${summary.returnRate}%` : '—'}
              icon={<FiBox />}
              hint="Share of orders returned"
              loading={isLoading}
            />
          </section>

          {/* Revenue line chart + Category donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <ChartHeader
                title="Revenue over time"
                subtitle={`Revenue from confirmed + delivered orders · ${TIMEFRAMES.find((t) => t.id === timeframe)?.label}`}
                icon={<FiTrendingUp size={14} />}
              />
              <RevenueLineChart series={data?.revenueSeries} loading={isLoading} />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <ChartHeader title="Category mix" subtitle="Share of units sold" icon={<FiPieChart size={14} />} />
              <CategoryDonut categories={data?.categoryShare} loading={isLoading} />
            </div>
          </div>

          {/* Daily orders bar + Top products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <ChartHeader title="Orders volume" subtitle="Per bucket (day / week / month based on range)" icon={<FiBox size={14} />} />
              <OrdersBarChart series={data?.revenueSeries} loading={isLoading} />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <ChartHeader title="Top products" subtitle="By units sold" />
              <TopProducts items={data?.topProducts} loading={isLoading} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------ Subcomponents ------------ */

function MetricCard({ title, value, growth, isGrowthGood, icon, hint, loading }) {
  const hasGrowth = growth != null && !Number.isNaN(growth);
  const goingUp = (growth ?? 0) >= 0;
  const growthGood = isGrowthGood ? goingUp : !goingUp;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="w-9 h-9 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
          {React.cloneElement(icon, { size: 16 })}
        </span>
        {hasGrowth && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
              growthGood
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-rose-50 text-rose-700 border-rose-100'
            }`}
          >
            {goingUp ? <FiArrowUpRight size={11} /> : <FiArrowDownRight size={11} />}
            {Math.abs(growth)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-7 w-28 bg-slate-100 rounded animate-pulse" />
        ) : (
          <div className="text-2xl font-semibold text-slate-900 tabular-nums">{value}</div>
        )}
        <div className="text-xs text-slate-500 mt-1">{title}</div>
        {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
      </div>
    </div>
  );
}

function ChartHeader({ title, subtitle, icon }) {
  return (
    <div className="flex items-start justify-between pb-4 border-b border-slate-100">
      <div className="flex items-center gap-2">
        {icon && (
          <span className="w-7 h-7 rounded-md bg-[#007074]/10 text-[#007074] flex items-center justify-center">
            {icon}
          </span>
        )}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function RevenueLineChart({ series, loading }) {
  if (loading) return <div className="h-64 mt-5 bg-slate-50 rounded-lg animate-pulse" />;
  if (!series?.length) return <EmptyChart message="No revenue in this range yet." />;

  const { path, areaPath, points, maxY, ticks } = buildChartGeometry(series);

  return (
    <div className="mt-5">
      <div className="relative h-64">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#007074" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#007074" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {ticks.map((t) => (
            <line key={t.y} x1="0" x2="100" y1={t.y} y2={t.y} stroke="#f1f5f9" strokeWidth="0.25" />
          ))}
          <path d={areaPath} fill="url(#revFill)" />
          <path d={path} fill="none" stroke="#007074" strokeWidth="1.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="1.4" fill="#fff" stroke="#007074" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        {/* Y-axis labels */}
        <div className="absolute inset-y-0 left-0 flex flex-col justify-between text-[10px] text-slate-400 font-medium py-1 -ml-1">
          {ticks.slice().reverse().map((t) => (
            <span key={t.y}>{fmtCompact(t.value)}</span>
          ))}
        </div>
        {/* Hover tooltips */}
        {points.map((p, i) => (
          <div
            key={`tt-${i}`}
            className="absolute group"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: 16, height: 16, transform: 'translate(-50%, -50%)' }}
          >
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] px-2 py-1 rounded whitespace-nowrap shadow">
              <div className="font-semibold">{fmtPKR(series[i].amount)}</div>
              <div className="text-slate-300 text-[10px]">{series[i].label} · {series[i].orders} orders</div>
            </div>
          </div>
        ))}
      </div>
      {/* X-axis */}
      <div className="grid mt-2 text-[10px] text-slate-400 font-medium" style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}>
        {series.map((s, i) => (
          <span key={i} className="text-center">
            {/* Only show every Nth label so it stays readable */}
            {shouldLabel(i, series.length) ? s.label : ''}
          </span>
        ))}
      </div>
      <div className="mt-4 text-xs text-slate-400 ml-14" style={{ paddingLeft: 0 }}>
        Max: <span className="text-slate-600 font-medium">{fmtPKR(maxY)}</span>
      </div>
    </div>
  );
}

function OrdersBarChart({ series, loading }) {
  if (loading) return <div className="h-56 mt-5 bg-slate-50 rounded-lg animate-pulse" />;
  if (!series?.length) return <EmptyChart message="No orders in this range yet." />;

  const max = Math.max(1, ...series.map((s) => s.orders));
  return (
    <div className="mt-5">
      <div className="h-56 flex items-end gap-1.5">
        {series.map((s, i) => {
          const h = (s.orders / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <div className="opacity-0 group-hover:opacity-100 absolute -top-6 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-10">
                {s.orders} orders
              </div>
              <div
                className="w-full max-w-[28px] rounded-t-md bg-slate-100 group-hover:bg-[#007074] transition-colors"
                style={{ height: `${Math.max(h, 3)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="grid mt-2 text-[10px] text-slate-400 font-medium" style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}>
        {series.map((s, i) => (
          <span key={i} className="text-center">{shouldLabel(i, series.length) ? s.label : ''}</span>
        ))}
      </div>
    </div>
  );
}

const DONUT_COLORS = ['#007074', '#14b8a6', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

function CategoryDonut({ categories, loading }) {
  if (loading) return <div className="aspect-square mt-6 bg-slate-50 rounded-full animate-pulse max-w-[220px] mx-auto" />;
  if (!categories?.length) return <EmptyChart message="No sales to split by category." />;

  const total = categories.reduce((sum, c) => sum + c.units, 0) || 1;
  // Build donut segments using dash offsets on a circumference-normalized radius.
  const R = 15.915; // r chosen so circumference ≈ 100
  let cumulative = 0;

  const segments = categories.slice(0, 7).map((c, i) => {
    const value = (c.units / total) * 100;
    const seg = { ...c, value, offset: -cumulative, color: DONUT_COLORS[i % DONUT_COLORS.length] };
    cumulative += value;
    return seg;
  });

  return (
    <div className="mt-5">
      <div className="relative aspect-square max-w-[220px] mx-auto flex items-center justify-center">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r={R} fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
          {segments.map((s, i) => (
            <circle
              key={i}
              cx="18" cy="18" r={R}
              fill="transparent"
              stroke={s.color}
              strokeWidth="4"
              strokeDasharray={`${s.value.toFixed(2)} 100`}
              strokeDashoffset={s.offset.toFixed(2)}
            />
          ))}
        </svg>
        <div className="absolute text-center">
          <div className="text-2xl font-semibold text-slate-900 tabular-nums">{total.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">units</div>
        </div>
      </div>
      <ul className="mt-6 space-y-2">
        {segments.map((s) => (
          <li key={s.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-slate-700 truncate">{s.name}</span>
            </span>
            <span className="text-slate-500 tabular-nums ml-2">{s.percentage}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopProducts({ items, loading }) {
  if (loading) {
    return (
      <div className="mt-5 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />
        ))}
      </div>
    );
  }
  if (!items?.length) return <EmptyChart message="No products sold yet." />;

  const max = Math.max(1, ...items.map((i) => i.units));
  return (
    <div className="mt-5 space-y-4">
      {items.map((p, i) => (
        <div key={p._id || i}>
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
              <div className="text-[11px] text-slate-400">{p.units} units</div>
            </div>
            <div className="text-sm text-slate-700 font-medium tabular-nums ml-3 flex-shrink-0">{fmtPKR(p.revenue)}</div>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#007074] rounded-full transition-all"
              style={{ width: `${(p.units / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-48 mt-5 flex items-center justify-center text-sm text-slate-400">
      {message}
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
      <FiAlertCircle className="mx-auto text-red-500 mb-3" size={28} />
      <h3 className="text-sm font-semibold text-slate-900">Couldn't load analytics</h3>
      <p className="text-sm text-slate-500 mt-1">Check that the backend is running and you're signed in as an admin.</p>
      <button
        onClick={() => onRetry()}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d]"
      >
        <FiRefreshCw size={14} /> Try again
      </button>
    </div>
  );
}

/* ------------ helpers ------------ */

// Decide which x-axis labels to render so long ranges don't overlap.
function shouldLabel(i, length) {
  if (length <= 10) return true;
  if (length <= 30) return i === 0 || i === length - 1 || i % 5 === 0;
  return i === 0 || i === length - 1 || i % Math.ceil(length / 8) === 0;
}

// Plain function (no hooks) — called after an early-return in RevenueLineChart,
// so using useMemo here would violate the Rules of Hooks. Cheap to recompute.
function buildChartGeometry(series) {
  const maxY = Math.max(...series.map((s) => s.amount), 1);
  const stepX = series.length > 1 ? 100 / (series.length - 1) : 0;

  const points = series.map((s, i) => ({
    x: i * stepX,
    y: 100 - (s.amount / maxY) * 90 - 5, // leave 5% margin top/bottom
    value: s.amount,
  }));

  const path = points
    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
    .join(' ');

  const areaPath =
    points.length > 0
      ? `${points
          .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
          .join(' ')} L100,100 L0,100 Z`
      : '';

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: 100 - pct * 90 - 5,
    value: pct * maxY,
  }));

  return { path, areaPath, points, maxY, ticks };
}
