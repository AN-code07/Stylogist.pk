import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiUser, FiShoppingBag, FiMapPin, FiSettings, FiLogOut, FiPackage,
  FiPlus, FiEdit2, FiTrash2, FiShield, FiCheckCircle, FiClock, FiTruck,
  FiXCircle, FiLoader, FiSave, FiAlertCircle, FiChevronRight, FiLock, FiEye, FiEyeOff
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  useMe,
  useUpdateProfile,
  useChangePassword,
} from '../features/user/useUserHooks';
import {
  useAddresses,
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
} from '../features/addresses/useAddressHooks';
import { useMyOrders } from '../features/orders/useOrderHooks';
import { useLogout } from '../features/auth/useAuthHooks';

const fmtPKR = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const MENU = [
  { id: 'profile', label: 'My profile', icon: <FiUser /> },
  { id: 'orders', label: 'Orders', icon: <FiShoppingBag /> },
  { id: 'addresses', label: 'Addresses', icon: <FiMapPin /> },
  { id: 'settings', label: 'Security', icon: <FiSettings /> },
];

export default function UserProfile() {
  const [tab, setTab] = useState('profile');
  const navigate = useNavigate();
  const logoutMut = useLogout();

  const { data: user, isLoading: loadingMe, isError: meError } = useMe();

  // Redirect if not authenticated (cookie check failed).
  useEffect(() => {
    if (meError) navigate('/login');
  }, [meError, navigate]);

  if (meError) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        <ProfileHeader user={user} loading={loadingMe} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm lg:sticky lg:top-6">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                {MENU.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setTab(m.id)}
                    className={`flex-1 lg:w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                      tab === m.id
                        ? 'bg-[#007074] text-white'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-base">{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </nav>
              <div className="my-2 h-px bg-slate-100 hidden lg:block" />
              <button
                onClick={() => logoutMut.mutate()}
                disabled={logoutMut.isPending}
                className="hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                <FiLogOut size={16} /> Sign out
              </button>
            </div>
          </aside>

          {/* Content */}
          <main className="lg:col-span-9">
            {tab === 'profile' && <ProfileTab user={user} loading={loadingMe} />}
            {tab === 'orders' && <OrdersTab />}
            {tab === 'addresses' && <AddressesTab />}
            {tab === 'settings' && <SecurityTab />}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ---------- Header ---------- */

function ProfileHeader({ user, loading }) {
  const initials = (user?.name || '?')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const { data: orders } = useMyOrders({ limit: 1 });
  const summary = orders?.summary;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div className="flex items-center gap-4 min-w-0">
        {loading ? (
          <div className="w-16 h-16 rounded-full bg-slate-100 animate-pulse" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#007074]/10 text-[#007074] flex items-center justify-center text-xl font-semibold flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-900 truncate">
            {loading ? 'Loading…' : user?.name || 'Customer'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {loading ? '' : user?.email}
            {user?.createdAt && (
              <>
                {' · '}Member since {fmtDate(user.createdAt)}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:flex md:gap-3">
        <MiniStat label="Orders" value={summary?.totalOrders ?? 0} />
        <MiniStat label="Lifetime spend" value={fmtPKR(summary?.totalSpend ?? 0)} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-center min-w-[110px]">
      <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-base font-semibold text-slate-900 mt-0.5 tabular-nums">{value}</div>
    </div>
  );
}

/* ---------- Profile tab ---------- */

function ProfileTab({ user, loading }) {
  const updateMut = useUpdateProfile();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
      setDirty(false);
    }
  }, [user?._id, user?.name, user?.email, user?.phone]);

  const change = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setDirty(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!dirty) return;

    const payload = {};
    if (form.name !== user?.name) payload.name = form.name.trim();
    if (form.email !== user?.email) payload.email = form.email.trim().toLowerCase();
    if (form.phone !== user?.phone) payload.phone = form.phone.trim();

    if (!Object.keys(payload).length) return toast('Nothing to update');

    try {
      await updateMut.mutateAsync(payload);
      setDirty(false);
    } catch { /* hook toast */ }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">Personal details</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full name">
            <input value={form.name} onChange={change('name')} className={inputCls} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={change('email')} className={inputCls} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={change('phone')} className={inputCls} />
          </Field>
          <Field label="Role">
            <input value={user?.role || ''} disabled className={inputCls + ' bg-slate-50 text-slate-500 cursor-not-allowed'} />
          </Field>
        </div>
      )}

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={!dirty || updateMut.isPending || loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {updateMut.isPending ? <FiLoader className="animate-spin" size={14} /> : <FiSave size={14} />}
          Save changes
        </button>
      </div>
    </form>
  );
}

/* ---------- Orders tab ---------- */

function OrdersTab() {
  const [status, setStatus] = useState('all');
  const { data, isLoading, isError } = useMyOrders({ status, limit: 20 });
  const items = data?.items ?? [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-6 py-5 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">My orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track your purchases and delivery status.
          </p>
        </div>
        <div className="inline-flex bg-slate-50 border border-slate-200 rounded-md p-0.5 w-max">
          {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                status === s ? 'bg-[#007074] text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {isError ? (
          <EmptyState icon={<FiAlertCircle />} title="Couldn't load orders" />
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FiPackage />}
            title={status === 'all' ? 'No orders yet' : `No ${status} orders`}
            body={
              <Link
                to="/category"
                className="inline-block mt-3 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d]"
              >
                Browse products
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {items.map((o) => (
              <OrderRow key={o._id} order={o} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OrderRow({ order }) {
  return (
    <li className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-md bg-[#007074]/10 text-[#007074] flex items-center justify-center flex-shrink-0">
            <FiPackage size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900">
              #{String(order._id).slice(-6).toUpperCase()}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {fmtDate(order.createdAt)} · {order.items?.length || 0} item
              {order.items?.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-semibold text-slate-900 tabular-nums">
            {fmtPKR(order.totalAmount)}
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>
      {order.items?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 truncate">
          {order.items.map((i) => i.name).join(' · ')}
        </div>
      )}
    </li>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: <FiClock size={10} /> },
    confirmed: { cls: 'bg-blue-50 text-blue-700 border-blue-100', icon: <FiCheckCircle size={10} /> },
    shipped: { cls: 'bg-violet-50 text-violet-700 border-violet-100', icon: <FiTruck size={10} /> },
    delivered: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <FiCheckCircle size={10} /> },
    cancelled: { cls: 'bg-slate-100 text-slate-500 border-slate-200', icon: <FiXCircle size={10} /> },
    returned: { cls: 'bg-rose-50 text-rose-700 border-rose-100', icon: <FiXCircle size={10} /> },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize ${s.cls}`}>
      {s.icon}
      {status}
    </span>
  );
}

/* ---------- Addresses tab ---------- */

function AddressesTab() {
  const { data: addresses = [], isLoading, isError } = useAddresses();
  const addMut = useAddAddress();
  const updateMut = useUpdateAddress();
  const deleteMut = useDeleteAddress();

  const [editing, setEditing] = useState(null); // null = not editing, 'new' = new, {...} = edit
  const [form, setForm] = useState(emptyForm());

  const startAdd = () => { setEditing('new'); setForm(emptyForm()); };
  const startEdit = (a) => { setEditing(a); setForm(a); };
  const cancel = () => { setEditing(null); setForm(emptyForm()); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing === 'new') await addMut.mutateAsync(form);
      else await updateMut.mutateAsync({ id: editing._id, payload: form });
      cancel();
    } catch { /* hook toast */ }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await deleteMut.mutateAsync(id);
    } catch { /* hook toast */ }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Saved addresses</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage your delivery locations.</p>
        </div>
        {!editing && (
          <button
            onClick={startAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#007074] text-white rounded-md text-xs font-medium hover:bg-[#005a5d]"
          >
            <FiPlus size={13} /> Add address
          </button>
        )}
      </div>

      <div className="p-6">
        {editing ? (
          <AddressForm
            form={form}
            setForm={setForm}
            onSubmit={submit}
            onCancel={cancel}
            submitting={addMut.isPending || updateMut.isPending}
            isNew={editing === 'new'}
          />
        ) : isError ? (
          <EmptyState icon={<FiAlertCircle />} title="Couldn't load addresses" />
        ) : isLoading ? (
          <div className="space-y-2">
            <div className="h-20 bg-slate-50 rounded-lg animate-pulse" />
            <div className="h-20 bg-slate-50 rounded-lg animate-pulse" />
          </div>
        ) : addresses.length === 0 ? (
          <EmptyState icon={<FiMapPin />} title="No addresses yet" body="Add one so checkout goes faster next time." />
        ) : (
          <ul className="space-y-3">
            {addresses.map((a) => (
              <li key={a._id} className="border border-slate-200 rounded-lg p-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
                  a.isDefault ? 'bg-[#007074] text-white' : 'bg-slate-50 text-slate-500'
                }`}>
                  <FiMapPin size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{a.label}</span>
                    {a.isDefault && (
                      <span className="text-[10px] font-medium text-[#007074] bg-[#007074]/10 px-1.5 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {[a.addressLine1, a.addressLine2, a.city, a.state, a.postalCode, a.country]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(a)}
                    className="w-8 h-8 rounded-md text-slate-400 hover:text-[#007074] hover:bg-slate-50 inline-flex items-center justify-center"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    onClick={() => remove(a._id)}
                    disabled={deleteMut.isPending}
                    className="w-8 h-8 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 inline-flex items-center justify-center disabled:opacity-50"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AddressForm({ form, setForm, onSubmit, onCancel, submitting, isNew }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">{isNew ? 'New address' : 'Edit address'}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Label"><input className={inputCls} value={form.label} onChange={set('label')} /></Field>
        <Field label="City"><input className={inputCls} value={form.city} onChange={set('city')} /></Field>
      </div>
      <Field label="Address line 1">
        <input className={inputCls} value={form.addressLine1} onChange={set('addressLine1')} />
      </Field>
      <Field label="Address line 2 (optional)">
        <input className={inputCls} value={form.addressLine2 || ''} onChange={set('addressLine2')} />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Province">
          <select className={inputCls} value={form.state} onChange={set('state')}>
            {['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Islamabad Capital', 'Gilgit-Baltistan', 'AJK'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Postal code"><input className={inputCls} value={form.postalCode} onChange={set('postalCode')} /></Field>
        <Field label="Country"><input className={inputCls} value={form.country} onChange={set('country')} /></Field>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={!!form.isDefault}
          onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          className="w-4 h-4 accent-[#007074]"
        />
        Set as default
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60"
        >
          {submitting && <FiLoader className="animate-spin" size={14} />}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function emptyForm() {
  return {
    label: 'Home',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Punjab',
    postalCode: '',
    country: 'Pakistan',
    isDefault: false,
  };
}

/* ---------- Security tab ---------- */

function SecurityTab() {
  const changeMut = useChangePassword();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword) return toast.error('Fill in all fields');
    if (form.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    if (form.newPassword !== form.confirm) return toast.error('Passwords do not match');
    try {
      await changeMut.mutateAsync({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch { /* hook toast */ }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 max-w-xl">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
        <FiShield className="text-[#007074]" size={16} />
        <h2 className="text-base font-semibold text-slate-900">Change password</h2>
      </div>
      <p className="text-xs text-slate-500 -mt-2">
        At least 8 characters, one uppercase, one number.
      </p>

      <PasswordRow
        label="Current password"
        value={form.currentPassword}
        onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
        visible={show.current}
        onToggle={() => setShow((s) => ({ ...s, current: !s.current }))}
      />
      <PasswordRow
        label="New password"
        value={form.newPassword}
        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
        visible={show.next}
        onToggle={() => setShow((s) => ({ ...s, next: !s.next }))}
      />
      <PasswordRow
        label="Confirm new password"
        value={form.confirm}
        onChange={(e) => setForm({ ...form, confirm: e.target.value })}
        visible={show.confirm}
        onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
        hint={form.confirm && form.confirm !== form.newPassword ? 'Passwords do not match' : undefined}
      />

      <div className="pt-3 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={changeMut.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60"
        >
          {changeMut.isPending ? <FiLoader className="animate-spin" size={14} /> : <FiShield size={14} />}
          Update password
        </button>
      </div>
    </form>
  );
}

function PasswordRow({ label, value, onChange, visible, onToggle, hint }) {
  return (
    <Field label={label} hint={hint} hintTone={hint ? 'error' : undefined}>
      <div className="relative">
        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          className={inputCls + ' pl-9 pr-10'}
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 w-6 h-6 inline-flex items-center justify-center"
        >
          {visible ? <FiEyeOff size={14} /> : <FiEye size={14} />}
        </button>
      </div>
    </Field>
  );
}

/* ---------- shared ---------- */

function Field({ label, hint, hintTone, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 mb-1 inline-block">{label}</span>
      {children}
      {hint && (
        <span className={`text-[11px] mt-1 block ${hintTone === 'error' ? 'text-red-600' : 'text-slate-400'}`}>
          {hint}
        </span>
      )}
    </label>
  );
}

const inputCls =
  'w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074] transition-colors';

function EmptyState({ icon, title, body }) {
  return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-300 mx-auto flex items-center justify-center mb-3">
        {React.cloneElement(icon, { size: 22 })}
      </div>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {typeof body === 'string' ? (
        <p className="text-sm text-slate-500 mt-1">{body}</p>
      ) : (
        body
      )}
    </div>
  );
}
