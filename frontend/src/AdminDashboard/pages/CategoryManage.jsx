import React, { useMemo, useState } from 'react';
import {
  FiPlus, FiFolder, FiEdit3, FiTrash2, FiChevronRight, FiImage, FiX, FiLoader, FiSearch
} from 'react-icons/fi';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../features/categories/useCategoryHooks';
import { useUploadImage } from '../../features/uploads/useUploadHooks';
import toast from 'react-hot-toast';

const emptyForm = { name: '', description: '', parent: '', image: '', isActive: true };

export default function CategoryManage() {
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');

  const { data: categories = [], isLoading } = useCategories({ active: 'all', includeCount: 'true' });
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const deleteMut = useDeleteCategory();
  const uploadMut = useUploadImage();

  const isSaving = createMut.isPending || updateMut.isPending;

  const { tree, parentOptions } = useMemo(() => {
    const filtered = search
      ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      : categories;
    const byId = Object.fromEntries(filtered.map((c) => [c._id, { ...c, children: [] }]));
    const roots = [];
    filtered.forEach((c) => {
      const node = byId[c._id];
      if (c.parent && byId[c.parent]) byId[c.parent].children.push(node);
      else roots.push(node);
    });
    const parentOptions = categories.filter((c) => c.level === 0);
    return { tree: roots, parentOptions };
  }, [categories, search]);

  const toggleRow = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadMut.mutateAsync(file);
      setForm((f) => ({ ...f, image: result.url }));
      toast.success('Image uploaded');
    } catch {
      /* toast already fired by hook */
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const handleEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      parent: cat.parent || '',
      image: cat.image || '',
      isActive: cat.isActive,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      parent: form.parent || null,
      image: form.image || null,
      isActive: form.isActive,
    };

    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing._id, payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      resetForm();
    } catch {
      /* hook handles toast */
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget._id);
      setDeleteTarget(null);
    } catch {
      /* hook handles toast */
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500 mt-1">Organize products by top-level groups and sub-categories.</p>
        </div>
        <div className="relative w-full md:w-72">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories"
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
            {editing ? 'Edit category' : 'New category'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name" required>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Women's Fashion"
                className={inputCls}
              />
            </Field>

            <Field label="Parent (optional)" hint="Leave empty for a top-level category">
              <select
                value={form.parent}
                onChange={(e) => setForm({ ...form, parent: e.target.value })}
                className={inputCls}
              >
                <option value="">— Top-level —</option>
                {parentOptions
                  .filter((p) => !editing || p._id !== editing._id)
                  .map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
              </select>
            </Field>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Short summary shown to shoppers"
                className={`${inputCls} resize-none`}
              />
            </Field>

            <Field label="Image">
              <ImagePicker
                url={form.image}
                uploading={uploadMut.isPending}
                onFile={handleFile}
                onClear={() => setForm({ ...form, image: '' })}
              />
            </Field>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 accent-[#007074]"
              />
              Active
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-[#007074] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving && <FiLoader className="animate-spin" size={16} />}
                {editing ? 'Save changes' : 'Create category'}
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

        {/* Tree */}
        <section className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-6">Name</div>
            <div className="col-span-2 text-center">Products</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-slate-400 text-sm">Loading categories…</div>
          ) : tree.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              {search ? 'No matches.' : 'No categories yet. Create your first one on the left.'}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tree.map((cat) => (
                <CategoryRow
                  key={cat._id}
                  cat={cat}
                  expanded={expanded}
                  onToggle={toggleRow}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete category"
          message={`Permanently delete "${deleteTarget.name}"? Sub-categories and linked products must be removed first.`}
          confirmLabel={deleteMut.isPending ? 'Deleting…' : 'Delete'}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function CategoryRow({ cat, expanded, onToggle, onEdit, onDelete, depth = 0 }) {
  const hasChildren = cat.children && cat.children.length > 0;
  const isOpen = expanded.has(cat._id);
  return (
    <li>
      <div
        className="grid grid-cols-12 items-center px-4 py-3 hover:bg-slate-50 transition-colors"
        style={{ paddingLeft: 16 + depth * 24 }}
      >
        <div className="col-span-6 flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => hasChildren && onToggle(cat._id)}
            className={`p-1 rounded transition-colors ${hasChildren ? 'hover:bg-slate-200 text-slate-500' : 'text-transparent'}`}
          >
            <FiChevronRight size={16} className={isOpen ? 'rotate-90 transition-transform' : 'transition-transform'} />
          </button>
          {cat.image ? (
            <img src={cat.image} alt={cat.name} className="w-8 h-8 rounded-md object-cover border border-slate-200" />
          ) : (
            <div className="w-8 h-8 rounded-md bg-[#007074]/10 text-[#007074] flex items-center justify-center">
              <FiFolder size={14} />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">{cat.name}</div>
            <div className="text-xs text-slate-400 truncate">/{cat.slug}</div>
          </div>
        </div>
        <div className="col-span-2 text-center text-sm text-slate-600">{cat.productCount ?? 0}</div>
        <div className="col-span-2 text-center">
          <span
            className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${
              cat.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {cat.isActive ? 'Active' : 'Hidden'}
          </span>
        </div>
        <div className="col-span-2 flex justify-end gap-1">
          <IconBtn onClick={() => onEdit(cat)} hover="text-blue-600 hover:bg-blue-50"><FiEdit3 size={14} /></IconBtn>
          <IconBtn onClick={() => onDelete(cat)} hover="text-red-600 hover:bg-red-50"><FiTrash2 size={14} /></IconBtn>
        </div>
      </div>
      {hasChildren && isOpen && (
        <ul className="bg-slate-50/30">
          {cat.children.map((child) => (
            <CategoryRow
              key={child._id}
              cat={child}
              expanded={expanded}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

const inputCls =
  'w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074] transition-colors';

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

export function ImagePicker({ url, uploading, onFile, onClear }) {
  return (
    <div>
      {url ? (
        <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-slate-200 group">
          <img src={url} alt="preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-slate-600 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <FiX size={12} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-[#007074] transition-colors">
          {uploading ? (
            <FiLoader className="animate-spin text-[#007074]" size={20} />
          ) : (
            <>
              <FiImage size={20} className="text-slate-400 mb-1" />
              <span className="text-xs text-slate-500">Click to upload</span>
            </>
          )}
          <input type="file" accept="image/*" onChange={onFile} className="hidden" />
        </label>
      )}
    </div>
  );
}

export function IconBtn({ children, hover = '', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-8 h-8 rounded-md flex items-center justify-center text-slate-400 transition-colors ${hover}`}
    >
      {children}
    </button>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-2">{message}</p>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
