import React, { useEffect, useState } from 'react';
import {
  FiUser, FiShield, FiMail, FiPhone, FiLock, FiSave, FiLoader, FiEye, FiEyeOff, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useMe, useUpdateProfile, useChangePassword } from '../../features/user/useUserHooks';

export default function AdminSettings() {
  const [tab, setTab] = useState('profile');

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile and account security.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Nav */}
        <nav className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-2 lg:sticky lg:top-6">
          <div className="flex lg:flex-col gap-1">
            <TabButton icon={<FiUser size={15} />} active={tab === 'profile'} onClick={() => setTab('profile')}>
              Profile
            </TabButton>
            <TabButton icon={<FiShield size={15} />} active={tab === 'security'} onClick={() => setTab('security')}>
              Security
            </TabButton>
          </div>
        </nav>

        {/* Content */}
        <section className="lg:col-span-9 bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8 min-h-[400px]">
          {tab === 'profile' && <ProfilePanel />}
          {tab === 'security' && <SecurityPanel />}
        </section>
      </div>
    </div>
  );
}

function TabButton({ icon, active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 lg:w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active ? 'bg-[#007074] text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

/* ------------ Profile ------------ */

function ProfilePanel() {
  const { data: user, isLoading, isError, refetch } = useMe();
  const updateMut = useUpdateProfile();

  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [dirty, setDirty] = useState(false);

  // Hydrate the form once user data arrives; also when the user swaps accounts.
  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
      setDirty(false);
    }
  }, [user?._id, user?.name, user?.email, user?.phone]);

  const onChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dirty) return;

    const payload = {};
    if (form.name && form.name !== user?.name) payload.name = form.name.trim();
    if (form.email && form.email !== user?.email) payload.email = form.email.trim().toLowerCase();
    if (form.phone && form.phone !== user?.phone) payload.phone = form.phone.trim();

    if (!Object.keys(payload).length) {
      toast('Nothing to save.', { icon: 'ℹ️' });
      return;
    }

    try {
      await updateMut.mutateAsync(payload);
      setDirty(false);
    } catch { /* hook toast */ }
  };

  if (isError) {
    return (
      <div className="text-center py-10">
        <FiAlertCircle className="mx-auto text-red-500 mb-3" size={24} />
        <p className="text-sm text-slate-500">Couldn't load your profile.</p>
        <button onClick={() => refetch()} className="mt-3 text-sm text-[#007074] hover:underline">
          Try again
        </button>
      </div>
    );
  }

  const initials = (user?.name || '?')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
        {isLoading ? (
          <div className="w-14 h-14 rounded-full bg-slate-100 animate-pulse" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#007074]/10 text-[#007074] flex items-center justify-center text-lg font-semibold">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900 truncate">
            {isLoading ? 'Loading…' : user?.name || 'Admin'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.role || '—'}
            {user?.email ? ` · ${user.email}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Display name">
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={form.name}
              onChange={onChange('name')}
              disabled={isLoading}
              className={inputWithIcon}
            />
          </div>
        </Field>

        <Field label="Email">
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="email"
              value={form.email}
              onChange={onChange('email')}
              disabled={isLoading}
              className={inputWithIcon}
            />
          </div>
        </Field>

        <Field label="Phone">
          <div className="relative">
            <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={form.phone}
              onChange={onChange('phone')}
              disabled={isLoading}
              className={inputWithIcon}
            />
          </div>
        </Field>

        <Field label="Role">
          <input
            value={user?.role || ''}
            disabled
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-500 cursor-not-allowed"
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
        <button
          type="submit"
          disabled={!dirty || updateMut.isPending || isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {updateMut.isPending ? <FiLoader className="animate-spin" size={14} /> : <FiSave size={14} />}
          Save changes
        </button>
      </div>
    </form>
  );
}

/* ------------ Security ------------ */

function SecurityPanel() {
  const changeMut = useChangePassword();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword) {
      return toast.error('Fill in all fields');
    }
    if (form.newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters');
    }
    if (form.newPassword !== form.confirm) {
      return toast.error('Passwords do not match');
    }
    try {
      await changeMut.mutateAsync({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch { /* hook toast */ }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Change password</h3>
        <p className="text-xs text-slate-500 mt-1">
          Use a strong password with at least 8 characters, one uppercase letter, and one number.
        </p>
      </div>

      <PasswordField
        label="Current password"
        value={form.currentPassword}
        onChange={update('currentPassword')}
        visible={show.current}
        onToggle={() => setShow((s) => ({ ...s, current: !s.current }))}
      />

      <PasswordField
        label="New password"
        value={form.newPassword}
        onChange={update('newPassword')}
        visible={show.next}
        onToggle={() => setShow((s) => ({ ...s, next: !s.next }))}
        hint={form.newPassword && form.newPassword.length < 8 ? 'Must be at least 8 characters' : undefined}
      />

      <PasswordField
        label="Confirm new password"
        value={form.confirm}
        onChange={update('confirm')}
        visible={show.confirm}
        onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
        hint={
          form.confirm && form.confirm !== form.newPassword ? 'Passwords do not match' : undefined
        }
        hintTone="error"
      />

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          type="submit"
          disabled={changeMut.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {changeMut.isPending ? <FiLoader className="animate-spin" size={14} /> : <FiShield size={14} />}
          Update password
        </button>
      </div>
    </form>
  );
}

function PasswordField({ label, value, onChange, visible, onToggle, hint, hintTone }) {
  return (
    <Field label={label} hint={hint} hintTone={hintTone}>
      <div className="relative">
        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          className={inputWithIcon + ' pr-10'}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 w-6 h-6 inline-flex items-center justify-center"
          tabIndex={-1}
        >
          {visible ? <FiEyeOff size={14} /> : <FiEye size={14} />}
        </button>
      </div>
    </Field>
  );
}

function Field({ label, hint, hintTone, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 mb-1 inline-block">{label}</span>
      {children}
      {hint && (
        <span
          className={`text-[11px] mt-1 block ${
            hintTone === 'error' ? 'text-red-600' : 'text-slate-400'
          }`}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

const inputWithIcon =
  'w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074] transition-colors disabled:opacity-60';
