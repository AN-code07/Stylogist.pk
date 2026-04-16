import React, { useState } from 'react';
import {
  FiSearch, FiUserCheck, FiUserX, FiEye, FiShield, FiSlash, FiX,
  FiShoppingBag, FiAlertTriangle, FiAlertCircle, FiRefreshCw, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import {
  useCustomers,
  useCustomerProfile,
  useBlockCustomer,
  useUnblockCustomer,
} from '../../features/admin/useAdminHooks';

const PAGE_SIZE = 25;

const fmtPKR = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function UserControl() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active'); // 'active' | 'blocked' | 'all'
  const [page, setPage] = useState(1);
  const [viewUserId, setViewUserId] = useState(null);
  const [actionUser, setActionUser] = useState(null); // customer being blocked/unblocked

  const query = { search, status, page, limit: PAGE_SIZE };
  const { data, isLoading, isError, refetch, isFetching } = useCustomers(query);

  const blockMut = useBlockCustomer();
  const unblockMut = useUnblockCustomer();

  const customers = data?.items ?? [];
  const pagination = data?.pagination;

  const onSearchChange = (v) => {
    setSearch(v);
    setPage(1);
  };

  const onStatusChange = (s) => {
    setStatus(s);
    setPage(1);
  };

  const handleConfirmAction = async () => {
    if (!actionUser) return;
    try {
      if (actionUser.isBlocked) await unblockMut.mutateAsync(actionUser._id);
      else await blockMut.mutateAsync(actionUser._id);
      setActionUser(null);
    } catch { /* hook toast */ }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage customer access and view lifetime value.</p>
        </div>

        <div className="inline-flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm w-max">
          <TabButton active={status === 'active'} onClick={() => onStatusChange('active')} icon={<FiShield size={13} />}>
            Active
          </TabButton>
          <TabButton active={status === 'blocked'} onClick={() => onStatusChange('blocked')} icon={<FiSlash size={13} />}>
            Blocked
          </TabButton>
          <TabButton active={status === 'all'} onClick={() => onStatusChange('all')}>
            All
          </TabButton>
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, email, or phone"
          className="w-full md:max-w-md pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
        />
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-left">Phone</th>
                    <th className="px-5 py-3 text-left">Joined</th>
                    <th className="px-5 py-3 text-right">Lifetime value</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-5 py-4" colSpan={6}>
                          <div className="h-8 bg-slate-50 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                        {search ? 'No customers match your search.' : 'No customers yet.'}
                      </td>
                    </tr>
                  ) : (
                    customers.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={u.name} />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-900 truncate">{u.name}</div>
                              <div className="text-xs text-slate-500 truncate">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-700 whitespace-nowrap">{u.phone || '—'}</td>
                        <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900 tabular-nums">{fmtPKR(u.totalSpend)}</div>
                          <div className="text-[11px] text-slate-400">
                            {u.totalOrders} {u.totalOrders === 1 ? 'order' : 'orders'}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <StatusBadge isBlocked={u.isBlocked} isVerified={u.isVerified} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => setViewUserId(u._id)}
                              title="View profile"
                              className="w-8 h-8 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-[#007074] hover:bg-teal-50"
                            >
                              <FiEye size={14} />
                            </button>
                            {u.isBlocked ? (
                              <button
                                onClick={() => setActionUser(u)}
                                title="Unblock"
                                className="w-8 h-8 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                              >
                                <FiUserCheck size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => setActionUser(u)}
                                title="Block"
                                className="w-8 h-8 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <FiUserX size={14} />
                              </button>
                            )}
                          </div>
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
                  <span className="font-medium text-slate-700">{pagination.pages}</span> ·{' '}
                  {pagination.total} total
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
        </>
      )}

      {/* View customer modal */}
      {viewUserId && (
        <CustomerProfileModal id={viewUserId} onClose={() => setViewUserId(null)} />
      )}

      {/* Confirm block/unblock */}
      {actionUser && (
        <ConfirmActionModal
          user={actionUser}
          loading={blockMut.isPending || unblockMut.isPending}
          onCancel={() => setActionUser(null)}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
}

/* ------------ subcomponents ------------ */

function TabButton({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active ? 'bg-[#007074] text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Avatar({ name }) {
  const initials = (name || '?')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-[#007074]/10 text-[#007074] flex items-center justify-center text-xs font-semibold flex-shrink-0">
      {initials}
    </div>
  );
}

function StatusBadge({ isBlocked, isVerified }) {
  if (isBlocked) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-100">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Blocked
      </span>
    );
  }
  if (!isVerified) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Unverified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
    </span>
  );
}

function CustomerProfileModal({ id, onClose }) {
  const { data, isLoading, isError } = useCustomerProfile(id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={data?.user?.name} />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900 truncate">
                {isLoading ? 'Loading…' : data?.user?.name || 'Customer'}
              </h2>
              {data?.user && (
                <p className="text-xs text-slate-500 truncate">
                  {data.user.email} · {data.user.phone || 'no phone'}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="p-6">
          {isError ? (
            <div className="text-sm text-red-600">Couldn't load customer details.</div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <StatBox
                  label="Lifetime value"
                  value={isLoading ? '…' : fmtPKR(data?.stats?.totalSpend)}
                  accent="text-[#007074]"
                />
                <StatBox
                  label="Total orders"
                  value={isLoading ? '…' : (data?.stats?.totalOrders ?? 0)}
                />
                <StatBox
                  label="Member since"
                  value={isLoading ? '…' : fmtDate(data?.user?.createdAt)}
                />
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FiShoppingBag size={13} /> Recent orders
                </h3>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {isLoading ? (
                    <div className="h-10 bg-slate-50 rounded animate-pulse" />
                  ) : !data?.recentOrders?.length ? (
                    <p className="text-sm text-slate-400 bg-slate-50 p-3 rounded-md border border-slate-100">
                      This customer hasn't placed any orders yet.
                    </p>
                  ) : (
                    data.recentOrders.map((o) => (
                      <div
                        key={o._id}
                        className="flex items-center justify-between px-3 py-2.5 border border-slate-100 rounded-md hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900">
                            #{String(o._id).slice(-6).toUpperCase()}{' '}
                            <span className="ml-1 text-[11px] font-normal text-slate-400">· {o.itemsCount} items</span>
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {o.items?.map((i) => i.name).join(', ') || '—'}
                          </div>
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <div className="text-sm font-medium text-slate-900 tabular-nums">
                            {fmtPKR(o.totalAmount)}
                          </div>
                          <div className="text-[11px] text-slate-400">{fmtDate(o.createdAt)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, accent = 'text-slate-900' }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
      <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-semibold mt-1 tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}

function ConfirmActionModal({ user, loading, onCancel, onConfirm }) {
  const blocking = !user.isBlocked;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-sm rounded-xl shadow-xl p-6 text-center">
        <div
          className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
            blocking ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
          }`}
        >
          {blocking ? <FiAlertTriangle size={22} /> : <FiUserCheck size={22} />}
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          {blocking ? 'Suspend this account?' : 'Restore this account?'}
        </h3>
        <p className="text-sm text-slate-500 mt-2">
          {blocking
            ? `${user.name} will not be able to log in or place orders until you unblock them.`
            : `${user.name} will be able to log in and shop again.`}
        </p>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 ${
              blocking ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {loading ? 'Saving…' : blocking ? 'Block' : 'Unblock'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
      <FiAlertCircle className="mx-auto text-red-500 mb-3" size={28} />
      <h3 className="text-sm font-semibold text-slate-900">Couldn't load customers</h3>
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
