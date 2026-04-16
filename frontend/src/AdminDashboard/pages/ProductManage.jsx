import React, { useMemo, useState } from 'react';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye, FiPackage, FiImage, FiUploadCloud,
  FiTag, FiChevronDown, FiX, FiLoader, FiAlertTriangle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useProducts, useCreateProduct, useDeleteProduct } from '../../features/products/useProductHooks';
import { useCategories } from '../../features/categories/useCategoryHooks';
import { useBrands } from '../../features/brands/useBrandHooks';
import { useUploadImage, useUploadImages } from '../../features/uploads/useUploadHooks';

const emptyVariant = () => ({
  sku: '',
  size: '',
  color: '',
  material: '',
  originalPrice: '',
  salePrice: '',
  stock: '',
});

const emptyForm = {
  name: '',
  description: '',
  shortDescription: '',
  category: '',
  subCategory: '',
  brand: '',
  status: 'draft',
  isFeatured: false,
  tags: '',
  keywords: '',
  variants: [emptyVariant()],
  media: [], // [{ url }]
};

export default function ProductManage() {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');

  const { data: productsResp, isLoading: loadingProducts } = useProducts({ status: 'all', limit: 50 });
  const { data: categories = [] } = useCategories({ active: 'all' });
  const { data: brands = [] } = useBrands();
  const createMut = useCreateProduct();
  const deleteMut = useDeleteProduct();
  const uploadOne = useUploadImage();
  const uploadMany = useUploadImages();

  const products = productsResp?.items ?? [];

  const { topCategories, subCategories } = useMemo(() => {
    const tops = categories.filter((c) => c.level === 0);
    const subs = form.category ? categories.filter((c) => String(c.parent) === form.category) : [];
    return { topCategories: tops, subCategories: subs };
  }, [categories, form.category]);

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q)
    );
  }, [products, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setView('list');
  };

  const updateVariant = (idx, patch) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)),
    }));
  };

  const addVariant = () => {
    setForm((f) => ({ ...f, variants: [...f.variants, emptyVariant()] }));
  };

  const removeVariant = (idx) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.length > 1 ? f.variants.filter((_, i) => i !== idx) : f.variants,
    }));
  };

  const handleMediaUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    try {
      const uploaded = await uploadMany.mutateAsync(files);
      setForm((f) => ({ ...f, media: [...f.media, ...uploaded.map((u) => ({ url: u.url }))] }));
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded`);
    } catch { /* hook toast */ }
    e.target.value = ''; // allow re-selecting same files
  };

  const removeMedia = (url) => {
    setForm((f) => ({ ...f, media: f.media.filter((m) => m.url !== url) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.description.trim() || form.description.trim().length < 5)
      return toast.error('Description must be at least 5 characters');
    if (!form.category) return toast.error('Select a category');

    // Require every variant to have prices & stock
    const variants = form.variants.map((v) => ({
      sku: v.sku.trim() || undefined,
      size: v.size.trim() || undefined,
      color: v.color.trim() || undefined,
      material: v.material.trim() || undefined,
      originalPrice: Number(v.originalPrice),
      salePrice: Number(v.salePrice),
      stock: Number(v.stock),
    }));

    for (const [i, v] of variants.entries()) {
      if (Number.isNaN(v.originalPrice) || Number.isNaN(v.salePrice) || Number.isNaN(v.stock)) {
        return toast.error(`Variant ${i + 1}: numeric fields required`);
      }
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim() || undefined,
      category: form.category,
      subCategory: form.subCategory || undefined,
      brand: form.brand || undefined,
      status: form.status,
      isFeatured: form.isFeatured,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      keywords: form.keywords.split(',').map((t) => t.trim()).filter(Boolean),
      variants,
      media: form.media.length ? form.media.map((m, idx) => ({ url: m.url, position: idx })) : undefined,
    };

    try {
      await createMut.mutateAsync(payload);
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
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-1">
            {view === 'list' ? 'All products across your catalog.' : 'Add a new product to your catalog.'}
          </p>
        </div>
        <button
          onClick={() => (view === 'list' ? setView('form') : resetForm())}
          className="px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] flex items-center gap-2"
        >
          {view === 'list' ? (<><FiPlus size={16} /> New product</>) : (<><FiEye size={16} /> View list</>)}
        </button>
      </header>

      {view === 'list' ? (
        <ListView
          products={filteredProducts}
          loading={loadingProducts}
          search={search}
          setSearch={setSearch}
          onDelete={setDeleteTarget}
        />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* LEFT: core fields */}
          <section className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
            <SectionTitle icon={<FiPackage size={14} />}>Details</SectionTitle>

            <Field label="Product name" required>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Silk Satin Slip Dress"
                className={inputCls}
              />
            </Field>

            <Field label="Short description" hint="One-line blurb shown in listings">
              <input
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                placeholder="Featherlight silk in a minimal silhouette"
                className={inputCls}
              />
            </Field>

            <Field label="Description" required>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Full product description with materials, fit, care instructions…"
                className={`${inputCls} resize-none`}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Category" required>
                <SelectInput
                  value={form.category}
                  onChange={(v) => setForm({ ...form, category: v, subCategory: '' })}
                  options={topCategories.map((c) => ({ value: c._id, label: c.name }))}
                  placeholder="Select category"
                />
              </Field>
              <Field label="Sub-category" hint={!form.category ? 'Pick a category first' : undefined}>
                <SelectInput
                  value={form.subCategory}
                  onChange={(v) => setForm({ ...form, subCategory: v })}
                  options={subCategories.map((c) => ({ value: c._id, label: c.name }))}
                  placeholder={subCategories.length ? 'Select sub-category' : 'None available'}
                  disabled={!subCategories.length}
                />
              </Field>
              <Field label="Brand">
                <SelectInput
                  value={form.brand}
                  onChange={(v) => setForm({ ...form, brand: v })}
                  options={brands.map((b) => ({ value: b._id, label: b.name }))}
                  placeholder="Select brand"
                />
              </Field>
              <Field label="Status">
                <SelectInput
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v })}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                  ]}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Tags" hint="Comma-separated">
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="winter, luxury, silk"
                  className={inputCls}
                />
              </Field>
              <Field label="Keywords" hint="Comma-separated, for search">
                <input
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                  placeholder="dress, slip, satin"
                  className={inputCls}
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="w-4 h-4 accent-[#007074]"
              />
              Mark as featured
            </label>
          </section>

          {/* RIGHT: media + variants */}
          <section className="lg:col-span-5 space-y-5">
            {/* Media */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <SectionTitle icon={<FiImage size={14} />}>Images</SectionTitle>

              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-[#007074] transition-colors">
                {uploadMany.isPending ? (
                  <FiLoader className="animate-spin text-[#007074]" size={22} />
                ) : (
                  <>
                    <FiUploadCloud size={22} className="text-[#007074] mb-1" />
                    <span className="text-xs text-slate-500">Click to upload (multiple)</span>
                  </>
                )}
                <input type="file" accept="image/*" multiple onChange={handleMediaUpload} className="hidden" />
              </label>

              {form.media.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {form.media.map((m) => (
                    <div key={m.url} className="relative aspect-square rounded-md overflow-hidden border border-slate-200 group">
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeMedia(m.url)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 text-slate-600 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Variants */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <SectionTitle icon={<FiTag size={14} />}>Variants</SectionTitle>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-xs font-medium text-[#007074] hover:underline flex items-center gap-1"
                >
                  <FiPlus size={12} /> Add variant
                </button>
              </div>
              <p className="text-xs text-slate-400 -mt-2">
                Leave SKU blank to auto-generate one (e.g. <code className="text-slate-500">NIK-FAS-SILKSATI-BLK-M-A1B2</code>).
              </p>

              <div className="space-y-3">
                {form.variants.map((v, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Variant {idx + 1}</span>
                      {form.variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <FiX size={14} />
                        </button>
                      )}
                    </div>
                    <input
                      value={v.sku}
                      onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                      placeholder="SKU (auto if blank)"
                      className={inputCls}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        value={v.size}
                        onChange={(e) => updateVariant(idx, { size: e.target.value })}
                        placeholder="Size"
                        className={inputCls}
                      />
                      <input
                        value={v.color}
                        onChange={(e) => updateVariant(idx, { color: e.target.value })}
                        placeholder="Color"
                        className={inputCls}
                      />
                      <input
                        value={v.material}
                        onChange={(e) => updateVariant(idx, { material: e.target.value })}
                        placeholder="Material"
                        className={inputCls}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.originalPrice}
                        onChange={(e) => updateVariant(idx, { originalPrice: e.target.value })}
                        placeholder="MRP"
                        className={inputCls}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.salePrice}
                        onChange={(e) => updateVariant(idx, { salePrice: e.target.value })}
                        placeholder="Sale"
                        className={inputCls}
                      />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={v.stock}
                        onChange={(e) => updateVariant(idx, { stock: e.target.value })}
                        placeholder="Stock"
                        className={inputCls}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Footer spanning both columns */}
          <div className="lg:col-span-12 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMut.isPending}
              className="px-5 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createMut.isPending && <FiLoader className="animate-spin" size={16} />}
              Save product
            </button>
          </div>
        </form>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <FiAlertTriangle size={22} />
            </div>
            <h3 className="text-base font-semibold text-slate-900 text-center">Delete product</h3>
            <p className="text-sm text-slate-500 mt-2 text-center">
              Permanently delete <span className="font-medium text-slate-800">{deleteTarget.name}</span> and all its variants & media?
            </p>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMut.isPending}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMut.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ListView({ products, loading, search, setSearch, onDelete }) {
  return (
    <>
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or slug"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Brand</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Stock</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-slate-400 text-sm">
                  {search ? 'No matches.' : 'No products yet. Create your first one.'}
                </td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <FiPackage size={14} className="text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
                          <div className="text-xs text-slate-400 truncate">/{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.category?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.brand?.name || '—'}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-900 font-medium">
                      {p.minPrice != null ? `Rs ${p.minPrice.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <span className={p.totalStock === 0 ? 'text-red-600' : 'text-slate-700'}>
                        {p.totalStock ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                          p.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onDelete(p)}
                        className="w-8 h-8 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function SectionTitle({ icon, children }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
      <span className="w-7 h-7 rounded-md bg-[#007074]/10 text-[#007074] flex items-center justify-center">{icon}</span>
      <h3 className="text-sm font-semibold text-slate-900">{children}</h3>
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 mb-1 inline-block">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
      {hint && <span className="text-[11px] text-slate-400 mt-1 block">{hint}</span>}
    </label>
  );
}

function SelectInput({ value, onChange, options, placeholder, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${inputCls} appearance-none pr-8 ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
    </div>
  );
}

const inputCls =
  'w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074] transition-colors';
