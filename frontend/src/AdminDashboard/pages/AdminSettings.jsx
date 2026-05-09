import React, { useEffect, useState } from 'react';
import {
  FiUser, FiShield, FiMail, FiPhone, FiLock, FiSave, FiLoader, FiEye, FiEyeOff,
  FiAlertCircle, FiLayout, FiPlus, FiTrash2, FiLink, FiMapPin, FiPhoneCall,
  FiCreditCard, FiShare2, FiUsers, FiImage
} from 'react-icons/fi';
import { useUploadImage } from '../../features/uploads/useUploadHooks';
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
            <TabButton icon={<FiUsers size={15} />} active={tab === 'visionaries'} onClick={() => setTab('visionaries')}>
              Visionaries
            </TabButton>
          </div>
        </nav>

        {/* Content */}
        <section className="lg:col-span-9 bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8 min-h-[400px]">
          {tab === 'profile' && <ProfilePanel />}
          {tab === 'security' && <SecurityPanel />}
          {tab === 'footer' && <FooterPanel />}
          {tab === 'visionaries' && <VisionariesPanel />}
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
              placeholder="HarbalMart.pk. All Rights Reserved."
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

/* ------------ Visionaries ------------ */

const emptyVisionary = () => ({ name: '', role: '', bio: '', image: '', socialUrl: '' });

function VisionariesPanel() {
  const { data, isLoading, isError, refetch } = useSiteSettings();
  const updateMut = useUpdateSiteSettings();
  const uploadOne = useUploadImage();

  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  useEffect(() => {
    if (!data?.about) return;
    setForm({
      visionHeading: data.about.visionHeading || '',
      visionBlurb: data.about.visionBlurb || '',
      visionaries: (data.about.visionaries || []).map((v) => ({
        name: v.name || '',
        role: v.role || '',
        bio: v.bio || '',
        image: v.image || '',
        socialUrl: v.socialUrl || '',
      })),
    });
    setDirty(false);
  }, [data]);

  if (isError) {
    return (
      <div className="text-center py-10">
        <FiAlertCircle className="mx-auto text-red-500 mb-3" size={24} />
        <p className="text-sm text-slate-500">Couldn't load visionaries.</p>
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

  const updateItem = (idx, patch) => {
    setForm((f) => ({
      ...f,
      visionaries: f.visionaries.map((v, i) => (i === idx ? { ...v, ...patch } : v)),
    }));
    setDirty(true);
  };

  const addItem = () => {
    setForm((f) => ({ ...f, visionaries: [...f.visionaries, emptyVisionary()] }));
    setDirty(true);
  };

  const removeItem = (idx) => {
    setForm((f) => ({ ...f, visionaries: f.visionaries.filter((_, i) => i !== idx) }));
    setDirty(true);
  };

  const handleImageUpload = async (idx, file) => {
    if (!file) return;
    setUploadingIndex(idx);
    try {
      const res = await uploadOne.mutateAsync({
        file,
        role: 'visionary',
        alt: form.visionaries[idx].name || 'Visionary',
      });
      updateItem(idx, { image: res.url });
    } catch { /* hook toast */ } finally {
      setUploadingIndex(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dirty) return toast('Nothing to save.', { icon: 'ℹ️' });
    const visionaries = form.visionaries
      .map((v) => ({
        name: v.name.trim(),
        role: v.role.trim(),
        bio: v.bio.trim(),
        image: v.image.trim(),
        socialUrl: v.socialUrl.trim(),
      }))
      .filter((v) => v.name && v.role);
    try {
      await updateMut.mutateAsync({
        about: {
          visionHeading: form.visionHeading.trim(),
          visionBlurb: form.visionBlurb.trim(),
          visionaries,
        },
      });
      setDirty(false);
    } catch { /* hook toast */ }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Meet the Visionaries</h3>
        <p className="text-xs text-slate-500 mt-1">
          People showcased on the About page. Name and role are required; everything else is optional.
        </p>
      </div>

      <Section title="Section heading" icon={<FiUsers size={14} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Heading">
            <input
              value={form.visionHeading}
              onChange={(e) => updateField('visionHeading', e.target.value)}
              className={plainInput}
              placeholder="Meet the Visionaries"
            />
          </Field>
          <Field label="Blurb">
            <input
              value={form.visionBlurb}
              onChange={(e) => updateField('visionBlurb', e.target.value)}
              className={plainInput}
              placeholder="One-line subtitle"
            />
          </Field>
        </div>
      </Section>

      <Section title="Visionaries" icon={<FiUsers size={14} />}>
        <div className="space-y-4">
          {form.visionaries.length === 0 && (
            <p className="text-xs text-slate-400 italic">No visionaries yet. Use "Add person" to create one.</p>
          )}
          {form.visionaries.map((v, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center text-slate-300 flex-shrink-0">
                  {v.image ? (
                    // eslint-disable-next-line jsx-a11y/img-redundant-alt
                    <img src={v.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FiImage size={18} />
                  )}
                </div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 cursor-pointer">
                  {uploadingIndex === idx ? <FiLoader className="animate-spin" size={12} /> : <FiImage size={12} />}
                  {v.image ? 'Replace photo' : 'Upload photo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(idx, e.target.files?.[0])}
                  />
                </label>
                <button type="button" onClick={() => removeItem(idx)} className="ml-auto">
                  <RemoveButton onClick={() => removeItem(idx)} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={v.name}
                  onChange={(e) => updateItem(idx, { name: e.target.value })}
                  placeholder="Full name"
                  className={plainInput}
                />
                <input
                  value={v.role}
                  onChange={(e) => updateItem(idx, { role: e.target.value })}
                  placeholder="Role / title"
                  className={plainInput}
                />
              </div>

              <textarea
                value={v.bio}
                onChange={(e) => updateItem(idx, { bio: e.target.value })}
                placeholder="Short bio (optional)"
                rows={2}
                className={plainInput}
              />

              <input
                value={v.socialUrl}
                onChange={(e) => updateItem(idx, { socialUrl: e.target.value })}
                placeholder="LinkedIn / profile URL (optional)"
                className={plainInput}
              />
            </div>
          ))}
          <AddButton onClick={addItem} label="Add person" />
        </div>
      </Section>

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 sticky bottom-0 bg-white py-3">
        <button
          type="submit"
          disabled={!dirty || updateMut.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {updateMut.isPending ? <FiLoader className="animate-spin" size={14} /> : <FiSave size={14} />}
          Save visionaries
        </button>
      </div>
    </form>
  );
}
