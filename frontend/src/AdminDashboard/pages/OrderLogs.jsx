import React, { useState } from 'react';
import {
  FiSearch, FiEye, FiClock, FiCheckCircle, FiXCircle, FiTruck, FiPackage,
  FiX, FiMapPin, FiUser, FiAlertCircle, FiRefreshCw, FiChevronLeft, FiChevronRight, FiLoader
} from 'react-icons/fi';
import { useAdminOrders, useUpdateOrderStatus } from '../../features/admin/useAdminHooks';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
const PAGE_SIZE = 25;

const fmtPKR = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-US', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

export default function OrderLogs() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const { data, isLoading, isError, refetch, isFetching } = useAdminOrders({
    status,
    search,
    page,
    limit: PAGE_SIZE,
  });

  const orders = data?.items ?? [];
  const pagination = data?.pagination;
  const selectedOrder = orders.find((o) => o._id === selectedId);

  const onFilter = (next) => {
    setStatus(next);
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage order lifecycle.</p>
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

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by customer name, email, phone, or order id"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
          />
        </div>
        <div className="inline-flex flex-wrap gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
          <FilterChip active={status === 'all'} onClick={() => onFilter('all')}>All</FilterChip>
          {STATUSES.map((s) => (
            <FilterChip key={s} active={status === s} onClick={() => onFilter(s)}>
              {s}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Table */}
      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Order</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Placed</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-5 py-4">
                        <div className="h-8 bg-slate-50 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                      {search || status !== 'all' ? 'No orders match your filters.' : 'No orders yet.'}
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr
                      key={o._id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedId(o._id)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                            <FiPackage size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900">
                              #{String(o._id).slice(-6).toUpperCase()}
                            </div>
                            <div className="text-xs text-slate-400">
                              {o.items?.length || 0} item{o.items?.length === 1 ? '' : 's'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-sm text-slate-700">{o.user?.name || 'Guest'}</div>
                        <div className="text-xs text-slate-400">{o.user?.email || ''}</div>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                      <td className="px-5 py-3 text-right text-sm font-medium text-slate-900 tabular-nums">
                        {fmtPKR(o.totalAmount)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedId(o._id); }}
                          className="w-8 h-8 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-[#007074] hover:bg-teal-50"
                          title="View"
                        >
                          <FiEye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <div className="text-xs text-slate-500">
                Page <span className="font-medium text-slate-700">{pagination.page}</span> of{' '}
                <span className="font-medium text-slate-700">{pagination.pages}</span> · {pagination.total} total
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-md border border-slate-200 inline-flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft size={14} />
                </button>
                <button
                  disabled={page >= pagination.pages || isFetching}
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  className="w-8 h-8 rounded-md border border-slate-200 inline-flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

/* ------------- subcomponents ------------- */

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
        active ? 'bg-[#007074] text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:   { cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: <FiClock size={11} /> },
    confirmed: { cls: 'bg-blue-50 text-blue-700 border-blue-100', icon: <FiCheckCircle size={11} /> },
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

function OrderDetailModal({ order, onClose }) {
  const updateMut = useUpdateOrderStatus();
  const [pendingStatus, setPendingStatus] = useState(null);

  const addr = order.shippingAddress;
  const addressLine =
    typeof addr === 'string'
      ? addr
      : addr
        ? [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country]
            .filter(Boolean)
            .join(', ')
        : '—';

  const onChange = async (newStatus) => {
    if (newStatus === order.status) return;
    setPendingStatus(newStatus);
    try {
      await updateMut.mutateAsync({ id: order._id, status: newStatus });
      onClose();
    } catch { /* hook toast */ }
    finally { setPendingStatus(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <header className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#007074] text-white flex items-center justify-center">
              <FiPackage size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Order #{String(order._id).slice(-6).toUpperCase()}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{fmtDate(order.createdAt)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100"
          >
            <FiX size={16} />
          </button>
        </header>

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Panel icon={<FiUser size={14} />} title="Customer">
              <div className="text-sm text-slate-800">{order.user?.name || 'Guest'}</div>
              <div className="text-xs text-slate-500 mt-0.5">{order.user?.email || ''}</div>
            </Panel>
            <Panel icon={<FiMapPin size={14} />} title="Shipping">
              <div className="text-sm text-slate-700 leading-relaxed">{addressLine}</div>
            </Panel>
          </div>

          <Panel title="Items" icon={<FiPackage size={14} />}>
            <div className="divide-y divide-slate-100 -mx-3">
              {(order.items || []).map((it, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="text-slate-800 truncate">{it.name}</div>
                    <div className="text-xs text-slate-400">SKU {it.sku} · qty {it.quantity}</div>
                  </div>
                  <div className="text-slate-700 tabular-nums ml-3 flex-shrink-0">
                    {fmtPKR(it.subtotal ?? it.total ?? it.price * it.quantity)}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 mt-3 pt-3 space-y-1.5 text-sm">
              <Row label="Subtotal" value={fmtPKR(order.subtotal)} />
              <Row label="Shipping" value={fmtPKR(order.shippingFee)} />
              <Row label="Total" value={fmtPKR(order.totalAmount)} bold />
            </div>
          </Panel>

          <Panel title="Update status" icon={<FiTruck size={14} />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STATUSES.map((s) => {
                const isCurrent = s === order.status;
                const isPending = pendingStatus === s && updateMut.isPending;
                return (
                  <button
                    key={s}
                    onClick={() => onChange(s)}
                    disabled={isCurrent || updateMut.isPending}
                    className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium border capitalize transition-colors ${
                      isCurrent
                        ? 'bg-[#007074] text-white border-[#007074]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-[#007074] hover:text-[#007074]'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {s}
                    {isPending ? (
                      <FiLoader className="animate-spin" size={12} />
                    ) : isCurrent ? (
                      <FiCheckCircle size={12} />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, icon, children }) {
  return (
    <section className="border border-slate-200 rounded-lg p-4">
      <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
        {icon} {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-medium text-slate-900' : 'text-slate-600'}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
      <FiAlertCircle className="mx-auto text-red-500 mb-3" size={28} />
      <h3 className="text-sm font-semibold text-slate-900">Couldn't load orders</h3>
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
