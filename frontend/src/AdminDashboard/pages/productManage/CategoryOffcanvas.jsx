import React, { useMemo, useState } from 'react';
import { FiImage, FiLoader, FiUploadCloud, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useCreateCategory } from '../../../features/categories/useCategoryHooks';
import { useUploadImage } from '../../../features/uploads/useUploadHooks';
import { CountedField, Field, SelectInput } from './fields';
import { UploadHint } from './MediaUploader';
import { inputCls, slugify } from './shared';

export default function CategoryOffcanvas({ categories, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');
  const [description, setDescription] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [image, setImage] = useState(null);
  const createCat = useCreateCategory();
  const uploadOne = useUploadImage();

  const topLevel = useMemo(() => categories.filter((c) => c.level === 0), [categories]);

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadOne.mutateAsync({
        file,
        productSlug: slugify(name) || 'category',
        role: 'thumbnail',
      });
      setImage({ url: res.url });
    } catch { /* hook toast */ }
    e.target.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Category name is required');
    // Cap meta lengths client-side so the backend's 60/160 validators
    // don't reject the whole form silently.
    if (metaTitle.length > 60) return toast.error('Meta title must be 60 characters or fewer');
    if (metaDescription.length > 160) return toast.error('Meta description must be 160 characters or fewer');
    try {
      const cat = await createCat.mutateAsync({
        name: name.trim(),
        parent: parent || null,
        description: description.trim() || undefined,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        image: image?.url || undefined,
      });
      onCreated(cat);
    } catch { /* hook toast */ }
  };

  return (
    <>
      <div className="offcanvas-backdrop" onClick={onClose} />
      <aside className="offcanvas-panel">
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Add category</h3>
            <p className="text-xs text-slate-500">New top-level or sub-category.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center">
            <FiX size={16} />
          </button>
        </header>
        <form onSubmit={submit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label="Name" required>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dresses" className={inputCls} />
          </Field>
          <Field label="Parent category" hint="Leave empty for a top-level category">
            <SelectInput
              value={parent}
              onChange={setParent}
              options={topLevel.map((c) => ({ value: c._id, label: c.name }))}
              placeholder="Top-level"
            />
          </Field>
            <CountedField
              label="Meta title"
              hint="≤ 60 chars · keep unique per category"
              value={metaTitle}
              max={60}
              onChange={setMetaTitle}
              placeholder="Women's Fashion | Stylogist"
            />
            <CountedField
              label="Meta description"
              hint="≤ 160 chars · summarises the category for Google"
              value={metaDescription}
              max={160}
              onChange={setMetaDescription}
              placeholder="Shop women's fashion at Stylogist — dresses, tops, accessories…"
            />
          <Field label="Description" hint="Rendered at the bottom of the public category page.">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Curated wardrobe staples for every season…"
            />
          </Field>
          <Field label="Cover image" hint="Shown on category tiles">
            <UploadHint>
              Recommended <strong>600 × 600&nbsp;px</strong> (square) · WebP or JPG · up to 10&nbsp;MB.
            </UploadHint>
            {image ? (
              <div className="mt-2 relative w-28 h-28 rounded-lg overflow-hidden border border-slate-200">
                <img src={image.url} alt="category" width="120" height="120" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-slate-600 flex items-center justify-center shadow"
                >
                  <FiX size={12} />
                </button>
              </div>
            ) : (
              <label className="mt-2 flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-[#007074] transition-colors">
                {uploadOne.isPending ? (
                  <FiLoader className="animate-spin text-[#007074]" size={20} />
                ) : (
                  <>
                    <FiUploadCloud size={20} className="text-[#007074] mb-1" />
                    <span className="text-xs text-slate-500">Upload cover</span>
                    <FiImage className="sr-only" />
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </label>
            )}
          </Field>
        </form>
        <footer className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={createCat.isPending}
            className="px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60 flex items-center gap-2">
            {createCat.isPending && <FiLoader className="animate-spin" size={14} />}
            Add category
          </button>
        </footer>
      </aside>
    </>
  );
}
