import React, { useEffect, useMemo, useState } from 'react';
import {
  FiSearch, FiEye, FiClock, FiCheckCircle, FiXCircle, FiTruck, FiPackage,
  FiX, FiMapPin, FiUser, FiAlertCircle, FiRefreshCw, FiChevronLeft, FiChevronRight, FiLoader, FiLink,
  FiEdit2, FiPlus, FiMinus, FiTrash2, FiSave
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAdminOrders, useUpdateOrderStatus, useEditOrder } from '../../features/admin/useAdminHooks';
import { useProductsSearch } from '../../features/products/useProductHooks';
import axiosClient from '../../api/axiosClient';
import { buildCustomerWhatsAppUrl } from '../../utils/whatsapp';

const STATUSES = ['pending', 'confirmed', 'shipped', 'partially_shipped', 'delivered', 'cancelled', 'returned'];

const SHIPMENT_STATUSES = new Set(['shipped', 'partially_shipped']);
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
            placeholder="Search by order id (e.g. A1B2C3 or full id), customer name, email, or phone"
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
                        <div className="text-sm text-slate-700">{o.user?.name || `${o.guest?.name || 'Guest'} (Guest)`}</div>
                        <div className="text-xs text-slate-400">{o.user?.email || o.guest?.email}</div>
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
      className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${active ? 'bg-[#007074] text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
        }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: <FiClock size={11} /> },
    confirmed: { cls: 'bg-blue-50 text-blue-700 border-blue-100', icon: <FiCheckCircle size={11} /> },
    shipped: { cls: 'bg-violet-50 text-violet-700 border-violet-100', icon: <FiTruck size={11} /> },
    partially_shipped: { cls: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100', icon: <FiTruck size={11} /> },
    delivered: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <FiCheckCircle size={11} /> },
    cancelled: { cls: 'bg-slate-100 text-slate-500 border-slate-200', icon: <FiXCircle size={11} /> },
    returned: { cls: 'bg-rose-50 text-rose-700 border-rose-100', icon: <FiXCircle size={11} /> },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${s.cls}`}>
      {s.icon}
      {(status || '').replace(/_/g, ' ')}
    </span>
  );
}

function OrderDetailModal({ order, onClose }) {
  const updateMut = useUpdateOrderStatus();
  const [pendingStatus, setPendingStatus] = useState(null);
  // When the admin picks a shipping status, we open a confirmation modal that
  // lets them tick exactly which line items are going out in this shipment.
  const [shipmentDraft, setShipmentDraft] = useState(null); // { status, indexes }

  // Free-form edit mode toggles a different layout that exposes editable
  // inputs for items / contact / address / shipping fee. Status & tracking
  // stay on their own dedicated control underneath.
  const [editMode, setEditMode] = useState(false);

  // New State for tracking details
  const [trackingCompany, setTrackingCompany] = useState(order.trackingCompany || '');
  const [trackingLink, setTrackingLink] = useState(order.trackingLink || '');
  const [trackingId, setTrackingId] = useState(order.trackingId || '');

  // Logic to determine the correct address to display
  const addr = order.shippingAddress || order.guestAddress;

  let addressLine = '—';
  if (typeof addr === 'string') {
    addressLine = addr;
  } else if (addr) {
    addressLine = [
      addr.addressLine1 || addr.line1,
      addr.addressLine2 || addr.line2,
      addr.city,
      addr.state,
      addr.postalCode,
      addr.country
    ]
      .filter(Boolean)
      .join(', ');
  }

  // Build the "Shipment dispatched" WhatsApp message and open a chat with
  // the customer pre-filled. We pull the phone from the most reliable
  // source available (guest.phone for guest checkouts, the shipping
  // address for registered users that didn't store one on the user doc).
  // If the phone can't be normalized into PK E.164 we toast instead of
  // shipping a broken wa.me link.
  const handleNotifyCustomer = () => {
    const rawPhone =
      order.guest?.phone ||
      order.shippingAddress?.phone ||
      order.guestAddress?.phone ||
      order.user?.phone ||
      '';

    const shippedItems = (order.items || []).filter((it) => it.shipped);
    // If the admin opens this on a "shipped" order whose individual items
    // weren't ticked yet (e.g. legacy data), fall back to the full list.
    const itemsForMessage = shippedItems.length ? shippedItems : (order.items || []);

    const orderRef = String(order._id).slice(-6).toUpperCase();
    const customerName = order.user?.name || order.guest?.name || 'Customer';

    const lines = [
      `Hi ${customerName}! 📦`,
      '',
      `Great news — your Stylogist order #${orderRef} has been shipped.`,
      '',
      'Items in this shipment:',
      ...itemsForMessage.map((it) => {
        const variant = [it.size, it.color, it.packSize].filter(Boolean).join(' / ');
        const variantStr = variant ? ` (${variant})` : '';
        return `• ${it.name}${variantStr} × ${it.quantity}`;
      }),
      '',
    ];

    if (order.trackingCompany || order.trackingId || order.trackingLink) {
      lines.push('Tracking details:');
      if (order.trackingCompany) lines.push(`• Courier: ${order.trackingCompany}`);
      if (order.trackingId) lines.push(`• Tracking ID: ${order.trackingId}`);
      if (order.trackingLink) lines.push(`• Track here: ${order.trackingLink}`);
      lines.push('');
    }

    lines.push(`Order total: ${fmtPKR(order.totalAmount)}`);
    lines.push('Thanks for shopping with Stylogist! Reply if you need anything.');

    const url = buildCustomerWhatsAppUrl(rawPhone, lines.join('\n'));
    if (!url) {
      toast.error("Couldn't read a valid customer phone for this order");
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Updates both status AND tracking info
  const onChange = async (newStatus) => {
    if (newStatus === order.status) return;

    // Shipping transitions open a per-item picker so the admin can dispatch
    // partial shipments. Default selection: items not already shipped, and
    // we seed the shipment-specific tracking fields with whatever's already
    // on the order so the admin only edits what's different for this batch.
    if (SHIPMENT_STATUSES.has(newStatus)) {
      const defaultIndexes = (order.items || [])
        .map((it, idx) => (it.shipped ? null : idx))
        .filter((v) => v !== null);
      setShipmentDraft({
        status: newStatus,
        indexes: defaultIndexes,
        trackingCompany: order.trackingCompany || '',
        trackingId: order.trackingId || '',
        trackingLink: order.trackingLink || '',
      });
      return;
    }

    setPendingStatus(newStatus);
    try {
      await updateMut.mutateAsync({
        id: order._id,
        status: newStatus,
        trackingCompany: trackingCompany.trim(),
        trackingLink: trackingLink.trim(),
        trackingId: trackingId.trim()
      });
      onClose();
    } catch { /* hook toast */ }
    finally { setPendingStatus(null); }
  };

  const onConfirmShipment = async () => {
    if (!shipmentDraft) return;
    if (!shipmentDraft.indexes.length) return;
    setPendingStatus(shipmentDraft.status);
    try {
      // Pass the shipment-scoped tracking fields straight through. They
      // overwrite the order's tracking record so the customer email shows
      // the courier responsible for *this* batch, even on later shipments.
      await updateMut.mutateAsync({
        id: order._id,
        status: shipmentDraft.status,
        trackingCompany: (shipmentDraft.trackingCompany || '').trim(),
        trackingLink: (shipmentDraft.trackingLink || '').trim(),
        trackingId: (shipmentDraft.trackingId || '').trim(),
        shippedItemIndexes: shipmentDraft.indexes,
      });
      // Mirror the freshly-saved tracking back into the parent panel so the
      // admin sees a consistent state even if they don't immediately reopen.
      setTrackingCompany((shipmentDraft.trackingCompany || '').trim());
      setTrackingLink((shipmentDraft.trackingLink || '').trim());
      setTrackingId((shipmentDraft.trackingId || '').trim());
      setShipmentDraft(null);
      onClose();
    } catch { /* hook toast */ }
    finally { setPendingStatus(null); }
  };

  // Dedicated function just to save tracking info without changing the status
  const onSaveTracking = async () => {
    setPendingStatus('tracking');
    try {
      await updateMut.mutateAsync({
        id: order._id,
        status: order.status,
        trackingCompany: trackingCompany.trim(),
        trackingLink: trackingLink.trim(),
        trackingId: trackingId.trim()
      });
      // Optionally show a success toast here
    } catch { /* hook toast */ }
    finally { setPendingStatus(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <header className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-3">
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
          <div className="flex items-center gap-2">
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                title="Edit order details"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:border-[#007074] hover:text-[#007074] transition-colors"
              >
                <FiEdit2 size={13} /> Edit order
              </button>
            )}
            {/* Send shipment details on customer's WhatsApp. Visible once
                the order has at least one shipped item or its overall
                status is a shipping state — admins can re-send any time. */}
            {(SHIPMENT_STATUSES.has(order.status) || (order.items || []).some((it) => it.shipped)) && (
              <button
                onClick={handleNotifyCustomer}
                title="Send shipment details on customer's WhatsApp"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-[#25D366] text-white hover:bg-[#1ebe5d] transition-colors shadow-sm"
              >
                <FaWhatsapp size={14} /> Notify on WhatsApp
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100"
            >
              <FiX size={16} />
            </button>
          </div>
        </header>

        <div className="p-6 overflow-y-auto space-y-5">
          {editMode && (
            <OrderEditor
              order={order}
              onSaved={() => setEditMode(false)}
              onCancel={() => setEditMode(false)}
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Panel icon={<FiUser size={14} />} title="Customer">
              <div className="text-sm text-slate-800">
                {order.user?.name || order.guest?.name || 'Guest'}
                {!order.user && <span className="ml-2 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">GUEST</span>}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {order.user?.email || order.guest?.email || 'No email'}
              </div>
              {order.guest?.phone && (
                <div className="text-xs text-slate-500 mt-0.5">{order.guest.phone}</div>
              )}
            </Panel>
            <Panel icon={<FiMapPin size={14} />} title="Shipping">
              <div className="text-sm text-slate-700 leading-relaxed">{addressLine}</div>
            </Panel>
          </div>

          <Panel title="Items" icon={<FiPackage size={14} />}>
            <div className="divide-y divide-slate-100 -mx-3">
              {(order.items || []).map((it, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-slate-800 truncate flex items-center gap-2">
                      {it.name}
                      {it.shipped && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                          <FiTruck size={9} /> Shipped
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">SKU {it.sku} · qty {it.quantity}</div>
                  </div>
                  <div className="text-slate-700 tabular-nums ml-3 flex-shrink-0">
                    {fmtPKR(it.subtotal ?? it.total ?? (it.price * it.quantity))}
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

          {/* New Tracking Panel */}
          {/* <Panel title="Tracking Information" icon={<FiLink size={14} />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase mb-1">Courier Company</label>
                <input
                  type="text"
                  value={trackingCompany}
                  onChange={(e) => setTrackingCompany(e.target.value)}
                  placeholder="e.g. TCS, Leopard"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase mb-1">Tracking ID</label>
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="e.g. 123456789"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase mb-1">Tracking Link</label>
                <input
                  type="url"
                  value={trackingLink}
                  onChange={(e) => setTrackingLink(e.target.value)}
                  placeholder="https://"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074] transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onSaveTracking}
                disabled={updateMut.isPending || (!trackingCompany && !trackingLink && !trackingId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
              >
                {pendingStatus === 'tracking' ? <FiLoader className="animate-spin" size={12} /> : <FiCheckCircle size={12} />}
                Save Tracking
              </button>
            </div>
          </Panel> */}

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
                    className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium border capitalize transition-colors ${isCurrent
                      ? 'bg-[#007074] text-white border-[#007074]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#007074] hover:text-[#007074]'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {s.replace(/_/g, ' ')}
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

      {shipmentDraft && (
        <ShipmentPickerModal
          order={order}
          draft={shipmentDraft}
          onChange={setShipmentDraft}
          onCancel={() => setShipmentDraft(null)}
          onConfirm={onConfirmShipment}
          submitting={updateMut.isPending}
        />
      )}
    </div>
  );
}

function ShipmentPickerModal({ order, draft, onChange, onCancel, onConfirm, submitting }) {
  const items = order.items || [];
  const selected = new Set(draft.indexes);
  const totalSelectable = items.filter((it) => !it.shipped).length;
  const willShipAll = selected.size === totalSelectable && totalSelectable > 0;
  const isFollowupShipment = items.some((it) => it.shipped);

  const update = (patch) => onChange({ ...draft, ...patch });

  const toggle = (idx) => {
    const next = new Set(selected);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    // Keep status in sync — selecting every remaining item promotes to "shipped".
    const promoted = next.size === totalSelectable ? 'shipped' : 'partially_shipped';
    update({ status: promoted, indexes: [...next].sort((a, b) => a - b) });
  };

  const toggleAll = () => {
    if (willShipAll) {
      update({ status: 'partially_shipped', indexes: [] });
    } else {
      const allIdx = items
        .map((it, idx) => (it.shipped ? null : idx))
        .filter((v) => v !== null);
      update({ status: 'shipped', indexes: allIdx });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
        <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#007074] text-white flex items-center justify-center">
              <FiTruck size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Select items to ship</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tick the items going out. Status will be set to{' '}
                <span className="font-semibold text-[#007074]">{draft.status.replace(/_/g, ' ')}</span>.
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 inline-flex items-center justify-center">
            <FiX size={16} />
          </button>
        </header>

        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 inline-flex items-center gap-1.5">
              <FiLink size={11} />
              {isFollowupShipment ? 'Tracking for this shipment' : 'Tracking information'}
            </h4>
            {isFollowupShipment && (
              <span className="text-[10px] text-slate-500">
                Different courier? Update the fields below before confirming.
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase mb-1">
                Courier company
              </label>
              <input
                type="text"
                value={draft.trackingCompany || ''}
                onChange={(e) => update({ trackingCompany: e.target.value })}
                placeholder="e.g. TCS, Leopard"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase mb-1">
                Tracking ID
              </label>
              <input
                type="text"
                value={draft.trackingId || ''}
                onChange={(e) => update({ trackingId: e.target.value })}
                placeholder="123456789"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase mb-1">
                Tracking link
              </label>
              <input
                type="url"
                value={draft.trackingLink || ''}
                onChange={(e) => update({ trackingLink: e.target.value })}
                placeholder="https://"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={toggleAll}
            disabled={totalSelectable === 0}
            className="text-xs font-medium text-[#007074] hover:underline disabled:opacity-40"
          >
            {willShipAll ? 'Deselect all' : 'Select all unshipped'}
          </button>
          <span className="text-[11px] text-slate-500">
            {selected.size} of {totalSelectable} selected
          </span>
        </div>

        <div className="overflow-y-auto p-5 space-y-2">
          {items.map((it, idx) => {
            const alreadyShipped = !!it.shipped;
            const isChecked = selected.has(idx);
            return (
              <label
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  alreadyShipped
                    ? 'bg-emerald-50/50 border-emerald-100 cursor-not-allowed'
                    : isChecked
                      ? 'bg-[#007074]/5 border-[#007074]/30'
                      : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  disabled={alreadyShipped}
                  checked={alreadyShipped || isChecked}
                  onChange={() => !alreadyShipped && toggle(idx)}
                  className="w-4 h-4 accent-[#007074]"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-slate-800 truncate flex items-center gap-2">
                    {it.name}
                    {alreadyShipped && (
                      <span className="text-[10px] font-semibold text-emerald-700">Already shipped</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">SKU {it.sku} · qty {it.quantity}</div>
                </div>
                <div className="text-sm font-semibold text-slate-700 tabular-nums">
                  {fmtPKR(it.subtotal ?? it.price * it.quantity)}
                </div>
              </label>
            );
          })}
        </div>

        <footer className="border-t border-slate-100 p-4 flex items-center justify-between gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting || selected.size === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting && <FiLoader className="animate-spin" size={14} />}
            Confirm shipment
          </button>
        </footer>
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

/* ----------------------------------------------------------------------
 * OrderEditor — free-form admin edit panel rendered inside the modal.
 * Patches: line items (add/remove/quantity), shipping fee, customer
 * contact, and the shipping address snapshot. Subtotal + total are
 * recomputed server-side; we mirror the math in the preview strip.
 * -------------------------------------------------------------------- */

function emptyAddress() {
  return {
    label: 'Home', addressLine1: '', addressLine2: '',
    city: '', state: '', postalCode: '', country: 'Pakistan',
  };
}

function OrderEditor({ order, onSaved, onCancel }) {
  const editMut = useEditOrder();

  const [items, setItems] = useState(() => (order.items || []).map((it) => ({
    product: typeof it.product === 'object' ? it.product?._id : it.product,
    name: it.name,
    sku: it.sku,
    price: Number(it.price || 0),
    quantity: Number(it.quantity || 1),
    shipped: !!it.shipped,
  })));
  const [shippingFee, setShippingFee] = useState(Number(order.shippingFee || 0));
  const [guest, setGuest] = useState(() => ({
    name: order.guest?.name || order.user?.name || '',
    email: order.guest?.email || order.user?.email || '',
    phone: order.guest?.phone || '',
  }));
  const [address, setAddress] = useState(() => {
    // Order can carry either a snapshot (`guestAddress`) or a populated ref
    // (`shippingAddress`). Prefer the snapshot; fall back to the populated
    // ref so registered-customer orders show their saved address as a
    // starting point. Saving will null the ref and persist the snapshot.
    const a = order.guestAddress || order.shippingAddress || emptyAddress();
    return {
      label: a.label || 'Home',
      addressLine1: a.addressLine1 || a.line1 || '',
      addressLine2: a.addressLine2 || a.line2 || '',
      city: a.city || '',
      state: a.state || '',
      postalCode: a.postalCode || '',
      country: a.country || 'Pakistan',
    };
  });
  const [pickerOpen, setPickerOpen] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0), 0),
    [items]
  );
  const total = subtotal + Number(shippingFee || 0);

  const updateQty = (idx, next) => {
    const q = Math.max(1, Number(next) || 1);
    setItems((arr) => arr.map((row, i) => (i === idx ? { ...row, quantity: q } : row)));
  };
  const removeItem = (idx) => setItems((arr) => arr.filter((_, i) => i !== idx));

  const addPicked = (picked) => {
    // Same product+SKU? bump qty instead of duplicating the row.
    setItems((arr) => {
      const at = arr.findIndex(
        (r) => String(r.product) === String(picked.product) && r.sku === picked.sku
      );
      if (at >= 0) {
        return arr.map((r, i) => (i === at ? { ...r, quantity: r.quantity + 1 } : r));
      }
      return [...arr, { ...picked, quantity: 1, shipped: false }];
    });
    setPickerOpen(false);
  };

  const submit = async () => {
    if (!items.length) return toast.error('At least one item is required');
    if (!guest.name.trim() || !guest.email.trim() || !guest.phone.trim()) {
      return toast.error('Customer name, email, and phone are required');
    }
    if (!address.addressLine1.trim() || !address.city.trim() || !address.state.trim()
      || !address.postalCode.trim() || !address.country.trim()) {
      return toast.error('Address line, city, state, postal code, and country are required');
    }
    try {
      await editMut.mutateAsync({
        id: order._id,
        patch: {
          items: items.map((it) => ({ product: it.product, sku: it.sku, quantity: it.quantity })),
          shippingFee: Number(shippingFee) || 0,
          guest: {
            name: guest.name.trim(),
            email: guest.email.trim(),
            phone: guest.phone.trim(),
          },
          guestAddress: address,
        },
      });
      onSaved();
    } catch { /* hook toast */ }
  };

  return (
    <section className="bg-amber-50/40 border border-amber-200 rounded-xl p-4 space-y-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-800">
          <FiEdit2 size={14} />
          <h3 className="text-[11px] font-bold uppercase tracking-wider">Edit order</h3>
        </div>
        <button onClick={onCancel} className="text-xs text-slate-600 hover:text-slate-900">
          Cancel edit
        </button>
      </header>

      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Items</span>
          <button
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#007074] hover:underline"
          >
            <FiPlus size={12} /> Add product
          </button>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">No items. Click Add product to insert one.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((it, idx) => (
              <li key={`${it.product}-${it.sku}-${idx}`} className="py-2 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-800 truncate flex items-center gap-2">
                    {it.name}
                    {it.shipped && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                        <FiTruck size={9} /> Shipped
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">SKU {it.sku} · {fmtPKR(it.price)} ea</div>
                </div>
                <div className="inline-flex items-center border border-slate-200 rounded-md overflow-hidden">
                  <button
                    onClick={() => updateQty(idx, it.quantity - 1)}
                    disabled={it.quantity <= 1}
                    className="w-7 h-7 inline-flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                  >
                    <FiMinus size={12} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={it.quantity}
                    onChange={(e) => updateQty(idx, e.target.value)}
                    className="w-10 text-center text-sm tabular-nums focus:outline-none"
                  />
                  <button
                    onClick={() => updateQty(idx, it.quantity + 1)}
                    className="w-7 h-7 inline-flex items-center justify-center text-slate-500 hover:bg-slate-50"
                  >
                    <FiPlus size={12} />
                  </button>
                </div>
                <div className="w-20 text-right text-sm tabular-nums text-slate-700 font-medium">
                  {fmtPKR(it.price * it.quantity)}
                </div>
                <button
                  onClick={() => removeItem(idx)}
                  disabled={it.shipped}
                  title={it.shipped ? 'Cannot remove a shipped item' : 'Remove item'}
                  className="w-7 h-7 inline-flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <FiTrash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Customer</div>
          <FieldInput label="Name" value={guest.name} onChange={(v) => setGuest((g) => ({ ...g, name: v }))} />
          <FieldInput label="Email" type="email" value={guest.email} onChange={(v) => setGuest((g) => ({ ...g, email: v }))} />
          <FieldInput label="Phone" value={guest.phone} onChange={(v) => setGuest((g) => ({ ...g, phone: v }))} />
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Shipping address</div>
          <FieldInput label="Label" value={address.label} onChange={(v) => setAddress((a) => ({ ...a, label: v }))} />
          <FieldInput label="Address line 1" value={address.addressLine1} onChange={(v) => setAddress((a) => ({ ...a, addressLine1: v }))} />
          <FieldInput label="Address line 2" value={address.addressLine2} onChange={(v) => setAddress((a) => ({ ...a, addressLine2: v }))} />
          <div className="grid grid-cols-2 gap-2">
            <FieldInput label="City" value={address.city} onChange={(v) => setAddress((a) => ({ ...a, city: v }))} />
            <FieldInput label="State" value={address.state} onChange={(v) => setAddress((a) => ({ ...a, state: v }))} />
            <FieldInput label="Postal code" value={address.postalCode} onChange={(v) => setAddress((a) => ({ ...a, postalCode: v }))} />
            <FieldInput label="Country" value={address.country} onChange={(v) => setAddress((a) => ({ ...a, country: v }))} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FieldInput
          label="Shipping fee"
          type="number"
          value={shippingFee}
          onChange={(v) => setShippingFee(Number(v) || 0)}
        />
        <div className="text-sm">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Subtotal</div>
          <div className="font-medium text-slate-900 tabular-nums">{fmtPKR(subtotal)}</div>
        </div>
        <div className="text-sm">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">New total</div>
          <div className="font-bold text-[#007074] tabular-nums">{fmtPKR(total)}</div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white"
        >
          Discard
        </button>
        <button
          onClick={submit}
          disabled={editMut.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60"
        >
          {editMut.isPending ? <FiLoader className="animate-spin" size={14} /> : <FiSave size={14} />}
          Save changes
        </button>
      </div>

      {pickerOpen && (
        <ProductPickerModal onClose={() => setPickerOpen(false)} onPick={addPicked} />
      )}
    </section>
  );
}

function FieldInput({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
      />
    </label>
  );
}

/* Product picker — opens on top of the order edit panel.
 * Lists searchable products via the body-driven /products/search hook.
 * After picking a product, fetches its variants so the admin can pick
 * the exact SKU before the line is added to the order. */
function ProductPickerModal({ onClose, onPick }) {
  const [search, setSearch] = useState('');
  const [activeProductId, setActiveProductId] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variants, setVariants] = useState([]);

  const { data, isLoading } = useProductsSearch(
    { search: search.trim() || undefined, limit: 20, sort: 'newest' },
  );
  const products = data?.items ?? [];

  // Detail fetch when a product is picked — list payload is lean and
  // doesn't carry variants, so we hit /products/id/:id here.
  useEffect(() => {
    if (!activeProductId) return;
    let cancelled = false;
    setLoadingVariants(true);
    axiosClient
      .get(`/products/id/${activeProductId}`)
      .then(({ data }) => {
        if (cancelled) return;
        setActiveProduct(data?.data?.product || null);
        setVariants(data?.data?.variants || []);
      })
      .catch(() => { if (!cancelled) toast.error('Failed to load variants'); })
      .finally(() => { if (!cancelled) setLoadingVariants(false); });
    return () => { cancelled = true; };
  }, [activeProductId]);

  const handlePick = (variant) => {
    if (!activeProduct) return;
    onPick({
      product: activeProduct._id,
      name: activeProduct.name,
      sku: variant.sku,
      price: Number(variant.salePrice),
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <header className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeProductId && (
              <button
                onClick={() => { setActiveProductId(null); setActiveProduct(null); setVariants([]); }}
                className="text-slate-400 hover:text-slate-700"
                title="Back to product list"
              >
                <FiChevronLeft size={16} />
              </button>
            )}
            <h3 className="text-sm font-semibold text-slate-900">
              {activeProductId ? 'Pick a variant' : 'Add product to order'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <FiX size={16} />
          </button>
        </header>

        {!activeProductId ? (
          <>
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products by name"
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-10 text-center text-slate-400 text-sm">Loading…</div>
              ) : products.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">No products match.</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <li key={p._id}>
                      <button
                        onClick={() => setActiveProductId(p._id)}
                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 text-left"
                      >
                        <div className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {p.image ? (
                            <img src={p.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FiPackage size={14} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-800 truncate">{p.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {p.brand?.name || '—'} · {fmtPKR(p.minPrice)}
                          </div>
                        </div>
                        <FiChevronRight size={14} className="text-slate-300" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="overflow-y-auto flex-1">
            {loadingVariants ? (
              <div className="p-10 text-center text-slate-400 text-sm">Loading variants…</div>
            ) : variants.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">This product has no variants.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {variants.map((v) => (
                  <li key={v._id || v.sku}>
                    <button
                      onClick={() => handlePick(v)}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-800 truncate">{activeProduct?.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {[v.size, v.color, v.packSize].filter(Boolean).join(' · ') || 'Default'} · SKU {v.sku}
                        </div>
                      </div>
                      <div className="text-sm tabular-nums text-slate-700 font-medium">
                        {fmtPKR(v.salePrice)}
                      </div>
                      {v.stock != null && (
                        <span className={`text-[10px] font-semibold tabular-nums ${v.stock === 0 ? 'text-red-500' : 'text-slate-400'}`}>
                          {v.stock} in stock
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}