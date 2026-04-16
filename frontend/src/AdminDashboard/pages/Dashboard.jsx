import React from 'react';
import {
  FiDollarSign, FiShoppingBag, FiUsers, FiAlertCircle,
  FiClock, FiCheckCircle, FiTrendingUp, FiTruck, FiXCircle, FiRefreshCw
} from 'react-icons/fi';
import { useOverview } from '../../features/admin/useAdminHooks';

const formatPKR = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;
const formatRelative = (iso) => {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function AdminDashboard() {
  const { data, isLoading, isError, refetch, isFetching } = useOverview();

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Live snapshot of store activity today.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60"
        >
          <FiRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <>
          {/* Metrics */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Revenue today"
              value={formatPKR(data?.revenueToday)}
              icon={<FiDollarSign />}
              accent="text-[#007074]"
              bg="bg-[#007074]/10"
              loading={isLoading}
            />
            <StatCard
              title="Orders today"
              value={data?.ordersToday ?? 0}
              icon={<FiShoppingBag />}
              accent="text-blue-600"
              bg="bg-blue-50"
              loading={isLoading}
            />
            <StatCard
              title="Active customers"
              value={data?.activeCustomers ?? 0}
              icon={<FiUsers />}
              accent="text-violet-600"
              bg="bg-violet-50"
              loading={isLoading}
            />
            <StatCard
              title="Low stock"
              value={data?.lowStockCount ?? 0}
              icon={<FiAlertCircle />}
              accent="text-red-600"
              bg="bg-red-50"
              loading={isLoading}
              hint={data?.lowStockCount ? 'Needs restocking' : 'Inventory healthy'}
            />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Recent orders */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Recent transactions</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Last 5 orders</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                      <th className="px-5 py-3 text-left">Order</th>
                      <th className="px-5 py-3 text-left">Customer</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-sm">Loading…</td></tr>
                    ) : !data?.recentOrders?.length ? (
                      <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-sm">No orders yet.</td></tr>
                    ) : (
                      data.recentOrders.map((o) => (
                        <tr key={o._id} className="hover:bg-slate-50">
                          <td className="px-5 py-3">
                            <div className="text-sm font-medium text-slate-900">#{String(o._id).slice(-6).toUpperCase()}</div>
                            <div className="text-xs text-slate-400">{o.itemsCount} item{o.itemsCount === 1 ? '' : 's'}</div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="text-sm text-slate-700">{o.customer}</div>
                            <div className="text-xs text-slate-400">{formatRelative(o.createdAt)}</div>
                          </td>
                          <td className="px-5 py-3 text-right text-sm font-medium text-slate-900">{formatPKR(o.amount)}</td>
                          <td className="px-5 py-3 text-right"><StatusBadge status={o.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <WeeklyPulseCard
                data={data?.weeklyPulse}
                loading={isLoading}
              />
              <LowStockCard
                items={data?.lowStockProducts}
                loading={isLoading}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, accent, bg, loading, hint }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className={`w-10 h-10 rounded-lg ${bg} ${accent} flex items-center justify-center`}>
          {React.cloneElement(icon, { size: 18 })}
        </span>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-7 w-24 bg-slate-100 rounded animate-pulse" />
        ) : (
          <div className="text-2xl font-semibold text-slate-900 tabular-nums">{value}</div>
        )}
        <div className="text-xs text-slate-500 mt-1">{title}</div>
      </div>
    </div>
  );
}

function WeeklyPulseCard({ data, loading }) {
  const max = Math.max(1, ...(data?.map((d) => d.amount) || [0]));
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">7-day revenue pulse</h3>
          <p className="text-xs text-slate-500 mt-0.5">Confirmed + delivered orders</p>
        </div>
        <FiTrendingUp className="text-[#007074]" size={16} />
      </div>
      <div className="h-32 mt-5 flex items-end gap-2">
        {loading ? (
          <div className="flex-1 h-full bg-slate-50 rounded-lg animate-pulse" />
        ) : !data?.length ? (
          <div className="flex-1 text-center text-xs text-slate-400 self-center">No data yet.</div>
        ) : (
          data.map((d) => {
            const h = (d.amount / max) * 100;
            return (
              <div key={d.date} className="group flex-1 flex flex-col items-center justify-end h-full relative">
                <div className="absolute -top-7 text-[10px] font-medium bg-slate-900 text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {d.amount ? `Rs ${Math.round(d.amount).toLocaleString()}` : '0'}
                </div>
                <div
                  className="w-full max-w-[22px] rounded-t-md bg-slate-100 group-hover:bg-[#007074] transition-colors"
                  style={{ height: `${Math.max(h, 4)}%` }}
                />
                <span className="mt-2 text-[10px] font-medium text-slate-400">{d.label}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function LowStockCard({ items, loading }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Low stock</h3>
          <p className="text-xs text-slate-500 mt-0.5">5 units or fewer remaining</p>
        </div>
        <FiAlertCircle className="text-red-500" size={16} />
      </div>
      <div className="mt-4 space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />
          ))
        ) : !items?.length ? (
          <p className="text-xs text-slate-400">Stock levels look healthy.</p>
        ) : (
          items.map((p) => (
            <div key={p._id} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-slate-50">
              <div className="min-w-0">
                <div className="text-sm text-slate-800 truncate">{p.name}</div>
                <div className="text-xs text-slate-400 truncate">/{p.slug}</div>
              </div>
              <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded-full px-2.5 py-0.5">
                {p.totalStock} left
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:   { cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: <FiClock size={11} /> },
    confirmed: { cls: 'bg-blue-50 text-blue-700 border-blue-100',   icon: <FiCheckCircle size={11} /> },
    shipped:   { cls: 'bg-violet-50 text-violet-700 border-violet-100', icon: <FiTruck size={11} /> },
    delivered: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <FiCheckCircle size={11} /> },
    cancelled: { cls: 'bg-slate-100 text-slate-500 border-slate-200', icon: <FiXCircle size={11} /> },
    returned:  { cls: 'bg-rose-50 text-rose-700 border-rose-100', icon: <FiXCircle size={11} /> },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${s.cls}`}>
      {s.icon}
      {status}
    </span>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
      <FiAlertCircle className="mx-auto text-red-500 mb-3" size={28} />
      <h3 className="text-sm font-semibold text-slate-900">Couldn't load dashboard stats</h3>
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
