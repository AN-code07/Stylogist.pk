import React, { useEffect, useMemo, useState } from 'react';
import {
  FiShield, FiUser, FiCheck, FiLoader, FiAlertCircle, FiSearch,
  FiPlus, FiX, FiEye, FiEyeOff
} from 'react-icons/fi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

// Mirror of the backend createAdminSchema rules (admin.validation.js). Mirrored
// client-side so the admin gets immediate feedback before the request fires.
const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p) => /[0-9]/.test(p), label: 'One number' },
  { test: (p) => /[@$!%*?&]/.test(p), label: 'One special character (@$!%*?&)' },
];

const emptyStaffForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'Staff',
  permissions: new Set(),
};

const usePermissionCatalogue = () =>
  useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/admin/permissions');
      return data.data;
    },
    staleTime: 60 * 60 * 1000,
  });

const useStaffList = () =>
  useQuery({
    queryKey: ['admin', 'staff'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/admin/staff');
      return data.data;
    },
  });

const useUpdatePermissions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, permissions }) => {
      const { data } = await axiosClient.patch(`/admin/staff/${id}/permissions`, { permissions });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'staff'] });
      toast.success('Permissions saved');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save permissions'),
  });
};

const useCreateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await axiosClient.post('/admin/create-admin', payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'staff'] });
      toast.success('Staff created');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create staff'),
  });
};

export default function StaffPermissions() {
  const { data: groups = [], isLoading: loadingCat } = usePermissionCatalogue();
  const { data: staff = [], isLoading: loadingStaff, isError } = useStaffList();
  const updateMut = useUpdatePermissions();

  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(new Set());
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const selected = useMemo(() => staff.find((s) => s._id === selectedId), [staff, selectedId]);

  // Hydrate the draft permission set every time the selection changes. We use
  // a Set internally for O(1) toggling; serialised back to an array on save.
  useEffect(() => {
    if (selected) {
      setDraft(new Set(selected.permissions || []));
    }
  }, [selectedId, selected]);

  // Auto-pick the first Staff member when the list loads (Super Admin's perms
  // are immutable — skip past them so the editor lands somewhere editable).
  useEffect(() => {
    if (selectedId || !staff.length) return;
    const first = staff.find((s) => s.role === 'Staff') || staff[0];
    setSelectedId(first._id);
  }, [staff, selectedId]);

  const filteredStaff = useMemo(() => {
    if (!search.trim()) return staff;
    const q = search.toLowerCase();
    return staff.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }, [staff, search]);

  const isSuperAdmin = selected?.role === 'Super Admin';

  const togglePermission = (key) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (group) => {
    const keys = group.permissions.map((p) => p.key);
    const allOn = keys.every((k) => draft.has(k));
    setDraft((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => (allOn ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  const onSave = async () => {
    if (!selected || isSuperAdmin) return;
    await updateMut.mutateAsync({ id: selected._id, permissions: [...draft] });
  };

  const isDirty = useMemo(() => {
    if (!selected) return false;
    const current = new Set(selected.permissions || []);
    if (current.size !== draft.size) return true;
    for (const k of draft) if (!current.has(k)) return true;
    return false;
  }, [draft, selected]);

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Staff & Permissions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Assign granular permissions to Staff users. Super Admins bypass all checks.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] shadow-sm"
        >
          <FiPlus size={14} /> Add staff
        </button>
      </header>

      {isError ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <FiAlertCircle className="mx-auto text-red-500 mb-3" size={28} />
          <p className="text-sm text-slate-600">Couldn't load staff list.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Staff list */}
          <section className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:sticky lg:top-6">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search staff…"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
                />
              </div>
            </div>
            {loadingStaff ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading staff…</div>
            ) : filteredStaff.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No staff match.</div>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
                {filteredStaff.map((s) => {
                  const active = s._id === selectedId;
                  return (
                    <li key={s._id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(s._id)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                          active ? 'bg-[#007074]/5' : ''
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          s.role === 'Super Admin' ? 'bg-amber-100 text-amber-700' : 'bg-[#007074]/10 text-[#007074]'
                        }`}>
                          {s.role === 'Super Admin' ? <FiShield size={15} /> : <FiUser size={15} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-900 truncate">{s.name}</div>
                          <div className="text-xs text-slate-500 truncate">{s.email}</div>
                        </div>
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            s.role === 'Super Admin'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {s.role}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Editor */}
          <section className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm">
            {!selected ? (
              <div className="p-12 text-center text-sm text-slate-400">
                Select a staff member to edit their permissions.
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <header className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{selected.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{selected.email}</p>
                  </div>
                  {isSuperAdmin ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">
                      <FiShield size={11} /> Super Admin · all access
                    </span>
                  ) : (
                    <button
                      onClick={onSave}
                      disabled={!isDirty || updateMut.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updateMut.isPending && <FiLoader className="animate-spin" size={14} />}
                      Save changes
                    </button>
                  )}
                </header>

                {isSuperAdmin && (
                  <div className="bg-amber-50 border border-amber-100 text-amber-900 text-xs rounded-lg px-3 py-2">
                    Super Admin permissions can't be edited — the role bypasses all permission checks.
                  </div>
                )}

                {loadingCat ? (
                  <div className="text-sm text-slate-400 py-6 text-center">Loading permission catalogue…</div>
                ) : (
                  <div className="space-y-4">
                    {groups.map((g) => {
                      const keys = g.permissions.map((p) => p.key);
                      const allOn = keys.every((k) => draft.has(k));
                      const anyOn = keys.some((k) => draft.has(k));
                      return (
                        <div key={g.group} className="border border-slate-200 rounded-lg overflow-hidden">
                          <header className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{g.group}</h3>
                            <button
                              type="button"
                              disabled={isSuperAdmin}
                              onClick={() => toggleGroup(g)}
                              className="text-[11px] font-medium text-[#007074] hover:underline disabled:opacity-50"
                            >
                              {allOn ? 'Deselect all' : anyOn ? 'Select remaining' : 'Select all'}
                            </button>
                          </header>
                          <ul className="divide-y divide-slate-100">
                            {g.permissions.map((p) => {
                              const checked = draft.has(p.key);
                              return (
                                <li key={p.key}>
                                  <label
                                    className={`flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 ${
                                      isSuperAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      disabled={isSuperAdmin}
                                      checked={isSuperAdmin || checked}
                                      onChange={() => togglePermission(p.key)}
                                      className="w-4 h-4 accent-[#007074]"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm text-slate-800">{p.label}</div>
                                      <div className="text-[11px] text-slate-400 font-mono">{p.key}</div>
                                    </div>
                                    {(isSuperAdmin || checked) && (
                                      <FiCheck size={14} className="text-[#007074]" />
                                    )}
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {showCreate && (
        <CreateStaffModal
          groups={groups}
          onClose={() => setShowCreate(false)}
          onCreated={(newUser) => {
            setShowCreate(false);
            if (newUser?.id) setSelectedId(newUser.id);
          }}
        />
      )}
    </div>
  );
}

function CreateStaffModal({ groups, onClose, onCreated }) {
  const createMut = useCreateStaff();
  const [form, setForm] = useState(emptyStaffForm);
  const [showPassword, setShowPassword] = useState(false);

  const passwordChecks = PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(form.password) }));
  const passwordValid = passwordChecks.every((c) => c.ok);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const nameValid = form.name.trim().length >= 3;
  const phoneValid = form.phone.trim().length >= 10;
  const canSubmit =
    nameValid && emailValid && phoneValid && passwordValid && !createMut.isPending;

  const togglePerm = (key) =>
    setForm((f) => {
      const next = new Set(f.permissions);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...f, permissions: next };
    });

  const toggleGroup = (g) => {
    const keys = g.permissions.map((p) => p.key);
    setForm((f) => {
      const next = new Set(f.permissions);
      const allOn = keys.every((k) => next.has(k));
      keys.forEach((k) => (allOn ? next.delete(k) : next.add(k)));
      return { ...f, permissions: next };
    });
  };

  const selectAll = () => {
    setForm((f) => {
      const next = new Set();
      groups.forEach((g) => g.permissions.forEach((p) => next.add(p.key)));
      return { ...f, permissions: next };
    });
  };

  const clearAll = () => setForm((f) => ({ ...f, permissions: new Set() }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
        // Super Admin bypasses permission checks; sending an empty array
        // for that role keeps the schema happy without storing noise.
        permissions: form.role === 'Staff' ? [...form.permissions] : [],
      };
      const created = await createMut.mutateAsync(payload);
      onCreated(created);
    } catch { /* hook toast */ }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-3xl rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#007074] text-white flex items-center justify-center">
              <FiUser size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Add staff member</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Creates an admin login. Permissions can be edited any time afterwards.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 inline-flex items-center justify-center"
          >
            <FiX size={16} />
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Full name" required hint="Shown in the staff list and audit logs.">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Aisha Khan"
                className={inputCls}
                autoFocus
              />
            </FormField>

            <FormField label="Email" required hint="Used to log in.">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="aisha@HarbalMart.pk"
                className={inputCls}
              />
            </FormField>

            <FormField label="Phone" required hint="At least 10 digits.">
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+923001234567"
                className={inputCls}
              />
            </FormField>

            <FormField label="Role" required hint="Super Admin bypasses every permission check.">
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={inputCls}
              >
                <option value="Staff">Staff</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </FormField>

            <FormField label="Password" required className="md:col-span-2" hint="They can reset it later via Forgot password.">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 chars · upper · lower · number · @$!%*?&"
                  className={`${inputCls} pr-10`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 inline-flex items-center justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2">
                {passwordChecks.map((c) => (
                  <li
                    key={c.label}
                    className={`text-[11px] flex items-center gap-1.5 ${
                      c.ok ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    <FiCheck size={11} className={c.ok ? 'opacity-100' : 'opacity-30'} /> {c.label}
                  </li>
                ))}
              </ul>
            </FormField>
          </div>

          {form.role === 'Staff' ? (
            <section className="border border-slate-200 rounded-lg overflow-hidden">
              <header className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Permissions
                </h3>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-slate-500">{form.permissions.size} selected</span>
                  <button type="button" onClick={selectAll} className="font-medium text-[#007074] hover:underline">
                    Select all
                  </button>
                  <span className="text-slate-300">·</span>
                  <button type="button" onClick={clearAll} className="font-medium text-slate-500 hover:underline">
                    Clear
                  </button>
                </div>
              </header>
              <div className="divide-y divide-slate-100">
                {groups.map((g) => {
                  const keys = g.permissions.map((p) => p.key);
                  const allOn = keys.every((k) => form.permissions.has(k));
                  const anyOn = keys.some((k) => form.permissions.has(k));
                  return (
                    <div key={g.group} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                          {g.group}
                        </h4>
                        <button
                          type="button"
                          onClick={() => toggleGroup(g)}
                          className="text-[11px] font-medium text-[#007074] hover:underline"
                        >
                          {allOn ? 'Deselect all' : anyOn ? 'Select remaining' : 'Select all'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {g.permissions.map((p) => {
                          const checked = form.permissions.has(p.key);
                          return (
                            <label
                              key={p.key}
                              className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-[#007074]/5 border-[#007074]/30'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePerm(p.key)}
                                className="w-4 h-4 accent-[#007074]"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs text-slate-800">{p.label}</div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">{p.key}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            <div className="bg-amber-50 border border-amber-100 text-amber-900 text-xs rounded-lg px-3 py-2 flex items-start gap-2">
              <FiShield size={14} className="mt-0.5 shrink-0" />
              <span>
                Super Admin accounts bypass every permission check and can create / edit other admins.
                Only assign this role to people you fully trust.
              </span>
            </div>
          )}
        </form>

        <footer className="border-t border-slate-100 p-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {createMut.isPending && <FiLoader className="animate-spin" size={14} />}
            Create staff
          </button>
        </footer>
      </div>
    </div>
  );
}

const inputCls =
  'w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074] transition-colors';

function FormField({ label, hint, required, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium text-slate-600 mb-1 inline-block">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
      {hint && <span className="text-[11px] text-slate-400 mt-1 block">{hint}</span>}
    </label>
  );
}
