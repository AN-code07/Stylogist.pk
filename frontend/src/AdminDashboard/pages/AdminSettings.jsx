import React, { useEffect, useState } from 'react';
import {
  FiUser, FiShield, FiMail, FiPhone, FiLock, FiSave, FiLoader, FiEye, FiEyeOff,
  FiAlertCircle, FiLayout, FiPlus, FiTrash2, FiLink, FiMapPin, FiPhoneCall,
  FiCreditCard, FiShare2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useMe, useUpdateProfile, useChangePassword } from '../../features/user/useUserHooks';
import { useSiteSettings, useUpdateSiteSettings } from '../../features/settings/useSettingsHooks';

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
            <TabButton icon={<FiLayout size={15} />} active={tab === 'footer'} onClick={() => setTab('footer')}>
              Footer
            </TabButton>
          </div>
        </nav>

        {/* Content */}
        <section className="lg:col-span-9 bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8 min-h-[400px]">
          {tab === 'profile' && <ProfilePanel />}
          {tab === 'security' && <SecurityPanel />}
          {tab === 'footer' && <FooterPanel />}
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

const plainInput =
  'w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074] transition-colors';

/* ------------ Footer ------------ */

const emptyLink = () => ({ label: '', path: '' });
const emptySocial = () => ({ platform: '', url: '', label: '' });
const emptyBadge = () => ({ label: '', tone: 'neutral' });

function FooterPanel() {
  const { data, isLoading, isError, refetch } = useSiteSettings();
  const updateMut = useUpdateSiteSettings();

  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Hydrate local form state from the server copy — only once, or when
  // switching accounts/settings. We keep a local draft so the admin can
  // make several edits before saving.
  useEffect(() => {
    if (!data?.footer) return;
    setForm({
      brandTagline: data.footer.brandTagline || '',
      address: data.footer.address || '',
      phone: data.footer.phone || '',
      email: data.footer.email || '',
      newsletterHeading: data.footer.newsletterHeading || '',
      newsletterBlurb: data.footer.newsletterBlurb || '',
      copyright: data.footer.copyright || '',
      shopLinks: (data.footer.shopLinks || []).map((l) => ({ label: l.label || '', path: l.path || '' })),
      customerCareLinks: (data.footer.customerCareLinks || []).map((l) => ({ label: l.label || '', path: l.path || '' })),
      legalLinks: (data.footer.legalLinks || []).map((l) => ({ label: l.label || '', path: l.path || '' })),
      socials: (data.footer.socials || []).map((s) => ({ platform: s.platform || '', url: s.url || '', label: s.label || '' })),
      paymentBadges: (data.footer.paymentBadges || []).map((b) => ({ label: b.label || '', tone: b.tone || 'neutral' })),
    });
    setDirty(false);
  }, [data]);

  if (isError) {
    return (
      <div className="text-center py-10">
        <FiAlertCircle className="mx-auto text-red-500 mb-3" size={24} />
        <p className="text-sm text-slate-500">Couldn't load footer settings.</p>
        <button onClick={() => refetch()} className="mt-3 text-sm text-[#007074] hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <FiLoader className="animate-spin" size={18} />
      </div>
    );
  }

  const updateField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const updateListItem = (key, index, patch) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
    setDirty(true);
  };

  const addListItem = (key, factory) => {
    setForm((f) => ({ ...f, [key]: [...f[key], factory()] }));
    setDirty(true);
  };

  const removeListItem = (key, index) => {
    setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));
    setDirty(true);
  };

  const cleanLinks = (arr) =>
    arr.map((l) => ({ label: l.label.trim(), path: l.path.trim() })).filter((l) => l.label && l.path);

  const cleanSocials = (arr) =>
    arr
      .map((s) => ({ platform: s.platform.trim().toLowerCase(), url: s.url.trim(), label: s.label.trim() }))
      .filter((s) => s.platform && s.url);

  const cleanBadges = (arr) =>
    arr.map((b) => ({ label: b.label.trim(), tone: b.tone === 'accent' ? 'accent' : 'neutral' })).filter((b) => b.label);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dirty) {
      toast('Nothing to save.', { icon: 'ℹ️' });
      return;
    }
    const payload = {
      footer: {
        brandTagline: form.brandTagline.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        newsletterHeading: form.newsletterHeading.trim(),
        newsletterBlurb: form.newsletterBlurb.trim(),
        copyright: form.copyright.trim(),
        shopLinks: cleanLinks(form.shopLinks),
        customerCareLinks: cleanLinks(form.customerCareLinks),
        legalLinks: cleanLinks(form.legalLinks),
        socials: cleanSocials(form.socials),
        paymentBadges: cleanBadges(form.paymentBadges),
      },
    };
    try {
      await updateMut.mutateAsync(payload);
      setDirty(false);
    } catch { /* hook toast */ }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Footer content</h3>
        <p className="text-xs text-slate-500 mt-1">
          These fields drive the public storefront footer. Changes go live for visitors
          as soon as you save.
        </p>
      </div>

      {/* Brand + contact */}
      <Section title="Brand & contact" icon={<FiMapPin size={14} />}>
        <Field label="Brand tagline">
          <textarea
            value={form.brandTagline}
            onChange={(e) => updateField('brandTagline', e.target.value)}
            rows={3}
            className={plainInput}
            placeholder="Short brand description shown under the logo"
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Address">
            <div className="relative">
              <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                className={inputWithIcon}
              />
            </div>
          </Field>
          <Field label="Phone">
            <div className="relative">
              <FiPhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className={inputWithIcon}
              />
            </div>
          </Field>
          <Field label="Support email">
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={inputWithIcon}
              />
            </div>
          </Field>
          <Field label="Copyright line">
            <input
              value={form.copyright}
              onChange={(e) => updateField('copyright', e.target.value)}
              className={plainInput}
              placeholder="Stylogist.pk. All Rights Reserved."
            />
          </Field>
        </div>
      </Section>

      {/* Shop links */}
      <LinkListSection
        title="Shop categories"
        icon={<FiLink size={14} />}
        items={form.shopLinks}
        onChange={(i, p) => updateListItem('shopLinks', i, p)}
        onAdd={() => addListItem('shopLinks', emptyLink)}
        onRemove={(i) => removeListItem('shopLinks', i)}
      />

      {/* Customer care links */}
      <LinkListSection
        title="Customer care"
        icon={<FiLink size={14} />}
        items={form.customerCareLinks}
        onChange={(i, p) => updateListItem('customerCareLinks', i, p)}
        onAdd={() => addListItem('customerCareLinks', emptyLink)}
        onRemove={(i) => removeListItem('customerCareLinks', i)}
      />

      {/* Legal links */}
      <LinkListSection
        title="Legal links (bottom bar)"
        icon={<FiLink size={14} />}
        items={form.legalLinks}
        onChange={(i, p) => updateListItem('legalLinks', i, p)}
        onAdd={() => addListItem('legalLinks', emptyLink)}
        onRemove={(i) => removeListItem('legalLinks', i)}
      />

      {/* Newsletter */}
      <Section title="Newsletter" icon={<FiMail size={14} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Heading">
            <input
              value={form.newsletterHeading}
              onChange={(e) => updateField('newsletterHeading', e.target.value)}
              className={plainInput}
            />
          </Field>
          <Field label="Blurb">
            <input
              value={form.newsletterBlurb}
              onChange={(e) => updateField('newsletterBlurb', e.target.value)}
              className={plainInput}
            />
          </Field>
        </div>
      </Section>

      {/* Socials */}
      <Section title="Social channels" icon={<FiShare2 size={14} />}>
        <p className="text-[11px] text-slate-400 -mt-2 mb-3">
          Supported platforms: instagram, facebook, twitter, youtube, linkedin. Others render a
          globe icon.
        </p>
        <div className="space-y-2">
          {form.socials.map((s, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1.2fr_1fr_auto] gap-2">
              <input
                value={s.platform}
                onChange={(e) => updateListItem('socials', idx, { platform: e.target.value })}
                placeholder="instagram"
                className={plainInput}
              />
              <input
                value={s.url}
                onChange={(e) => updateListItem('socials', idx, { url: e.target.value })}
                placeholder="https://..."
                className={plainInput}
              />
              <input
                value={s.label}
                onChange={(e) => updateListItem('socials', idx, { label: e.target.value })}
                placeholder="Accessible label"
                className={plainInput}
              />
              <RemoveButton onClick={() => removeListItem('socials', idx)} />
            </div>
          ))}
          <AddButton onClick={() => addListItem('socials', emptySocial)} label="Add social channel" />
        </div>
      </Section>

      {/* Payment badges */}
      <Section title="Payment badges" icon={<FiCreditCard size={14} />}>
        <div className="space-y-2">
          {form.paymentBadges.map((b, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_160px_auto] gap-2">
              <input
                value={b.label}
                onChange={(e) => updateListItem('paymentBadges', idx, { label: e.target.value })}
                placeholder="Visa, Mastercard, COD…"
                className={plainInput}
              />
              <select
                value={b.tone}
                onChange={(e) => updateListItem('paymentBadges', idx, { tone: e.target.value })}
                className={plainInput}
              >
                <option value="neutral">Neutral</option>
                <option value="accent">Accent (teal)</option>
              </select>
              <RemoveButton onClick={() => removeListItem('paymentBadges', idx)} />
            </div>
          ))}
          <AddButton onClick={() => addListItem('paymentBadges', emptyBadge)} label="Add payment badge" />
        </div>
      </Section>

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 sticky bottom-0 bg-white py-3">
        <button
          type="submit"
          disabled={!dirty || updateMut.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {updateMut.isPending ? <FiLoader className="animate-spin" size={14} /> : <FiSave size={14} />}
          Save footer
        </button>
      </div>
    </form>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <span className="w-7 h-7 rounded-md bg-[#007074]/10 text-[#007074] inline-flex items-center justify-center">
          {icon}
        </span>
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function LinkListSection({ title, icon, items, onChange, onAdd, onRemove }) {
  return (
    <Section title={title} icon={icon}>
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-xs text-slate-400 italic">No links yet. Use "Add link" below.</p>
        )}
        {items.map((link, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_1.2fr_auto] gap-2">
            <input
              value={link.label}
              onChange={(e) => onChange(idx, { label: e.target.value })}
              placeholder="Label"
              className={plainInput}
            />
            <input
              value={link.path}
              onChange={(e) => onChange(idx, { path: e.target.value })}
              placeholder="/path or https://..."
              className={plainInput}
            />
            <RemoveButton onClick={() => onRemove(idx)} />
          </div>
        ))}
        <AddButton onClick={onAdd} label="Add link" />
      </div>
    </Section>
  );
}

function AddButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#007074] hover:text-[#005a5d] mt-1"
    >
      <FiPlus size={13} /> {label}
    </button>
  );
}

function RemoveButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-9 h-9 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
      aria-label="Remove"
    >
      <FiTrash2 size={14} />
    </button>
  );
}
