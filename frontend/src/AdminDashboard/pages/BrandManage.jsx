import React, { useMemo, useState } from 'react';
import {
  FiPlus, FiEdit3, FiTrash2, FiLoader, FiSearch, FiStar, FiTag
} from 'react-icons/fi';
import {
  useBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
} from '../../features/brands/useBrandHooks';
import { useUploadImage } from '../../features/uploads/useUploadHooks';
import { ImagePicker, IconBtn, ConfirmDialog } from './CategoryManage';
import toast from 'react-hot-toast';

const emptyForm = {
  name: '',
  description: '',
  website: '',
  logo: '',
  isFeatured: false,
  isActive: true,
};

export default function BrandManage() {
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');

  const { data: brands = [], isLoading } = useBrands({ includeCount: 'true' });
  const createMut = useCreateBrand();
  const updateMut = useUpdateBrand();
  const deleteMut = useDeleteBrand();
  const uploadMut = useUploadImage();

  const isSaving = createMut.isPending || updateMut.isPending;

  const filtered = useMemo(() => {
    if (!search) return brands;
    const q = search.toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadMut.mutateAsync(file);
      setForm((f) => ({ ...f, logo: result.url }));
      toast.success('Logo uploaded');
    } catch { /* hook toast */ }
  };

  const handleEdit = (brand) => {
    setEditing(brand);
    setForm({
      name: brand.name,
      description: brand.description || '',
      website: brand.website || '',
      logo: brand.logo || '',
      isFeatured: !!brand.isFeatured,
      isActive: !!brand.isActive,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Brand name is required');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      website: form.website.trim() || undefined,
      logo: form.logo || null,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };

    try {
      if (editing) await updateMut.mutateAsync({ id: editing._id, payload });
      else await createMut.mutateAsync(payload);
      resetForm();
    } catch { /* hook toast */ }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget._id);
      setDeleteTarget(null);
    } catch { /* hook toast */ }
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Brands</h1>
          <p className="text-sm text-slate-500 mt-1">Manage brand identity, logos, and visibility.</p>
        </div>
        <div className="relative w-full md:w-72">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form */}
        <section className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-6 shadow-sm lg:sticky lg:top-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#007074]/10 text-[#007074] flex items-center justify-center">
              {editing ? <FiEdit3 size={16} /> : <FiPlus size={16} />}
            </span>
            {editing ? 'Edit brand' : 'New brand'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name" required>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Nike"
                className={inputCls}
              />
            </Field>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Brand story or positioning"
                className={`${inputCls} resize-none`}
              />
            </Field>

            <Field label="Website">
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://example.com"
                className={inputCls}
              />
            </Field>

            <Field label="Logo">
              <ImagePicker
                url={form.logo}
                uploading={uploadMut.isPending}
                onFile={handleFile}
                onClear={() => setForm({ ...form, logo: '' })}
              />
            </Field>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 accent-[#007074]"
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="w-4 h-4 accent-[#007074]"
                />
                Featured
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-[#007074] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving && <FiLoader className="animate-spin" size={16} />}
                {editing ? 'Save changes' : 'Create brand'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* List */}
        <section className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-slate-400 text-sm">Loading brands…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              {search ? 'No matches.' : 'No brands yet. Create your first one on the left.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
              {filtered.map((b) => (
                <article
                  key={b._id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow flex gap-4"
                >
                  <div className="flex-shrink-0">
                    {b.logo ? (
                      <img src={b.logo} alt={b.name} className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-[#007074]/10 text-[#007074] flex items-center justify-center">
                        <FiTag size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">{b.name}</h3>
                          {b.isFeatured && (
                            <FiStar size={12} className="text-amber-500 flex-shrink-0" title="Featured" />
                          )}
                        </div>
                        <div className="text-xs text-slate-400 truncate">/{b.slug}</div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <IconBtn onClick={() => handleEdit(b)} hover="text-blue-600 hover:bg-blue-50"><FiEdit3 size={14} /></IconBtn>
                        <IconBtn onClick={() => setDeleteTarget(b)} hover="text-red-600 hover:bg-red-50"><FiTrash2 size={14} /></IconBtn>
                      </div>
                    </div>
                    {b.description && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{b.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-medium ${
                          b.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {b.isActive ? 'Active' : 'Hidden'}
                      </span>
                      <span className="text-slate-500">{b.productCount ?? 0} products</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete brand"
          message={`Permanently delete "${deleteTarget.name}"? Products linked to this brand must be reassigned first.`}
          confirmLabel={deleteMut.isPending ? 'Deleting…' : 'Delete'}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

const inputCls =
  'w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074] transition-colors';

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 mb-1 inline-block">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
