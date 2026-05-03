import React, { useState } from 'react';
import { FiLoader, FiUploadCloud, FiX, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useCreateIngredient } from '../../../features/ingredients/useIngredientHooks';
import { useUploadImage } from '../../../features/uploads/useUploadHooks';
import { CountedField, Field } from './fields';
import { UploadHint } from './MediaUploader';
import BulletListEditor from './BulletListEditor';
import FaqEditor from './FaqEditor';
import { inputCls, slugify } from './shared';

// Inline ingredient creator opened from the product form. Mirrors the
// full IngredientManage editor — name, SEO meta, description, image,
// benefits, uses, FAQ, and the isIndexable / isActive flags — so admins
// don't have to context-switch to the dedicated page when tagging a
// product. Created ingredient is auto-selected on success.
export default function IngredientOffcanvas({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [image, setImage] = useState(null);
  const [benefits, setBenefits] = useState([]);
  const [uses, setUses] = useState([]);
  const [faq, setFaq] = useState([]);
  const [isIndexable, setIsIndexable] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const uploadOne = useUploadImage();
  const createIngredient = useCreateIngredient();

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadOne.mutateAsync({
        file,
        productSlug: slugify(name) || 'ingredient',
        role: 'thumbnail',
      });
      setImage({ url: res.url });
    } catch { /* hook toast */ }
    e.target.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Ingredient name is required');
    if (metaTitle.length > 60) return toast.error('Meta title must be 60 characters or fewer');
    if (metaDescription.length > 160) return toast.error('Meta description must be 160 characters or fewer');

    // Mirror the backend: drop empty bullet rows + half-filled FAQ entries
    // before submit so the server-side schema (which requires .min(1) per
    // bullet and both Q+A on FAQ rows) doesn't reject the payload.
    const cleanBenefits = (benefits || []).map((b) => (b || '').trim()).filter(Boolean);
    const cleanUses = (uses || []).map((u) => (u || '').trim()).filter(Boolean);
    const cleanFaq = (faq || [])
      .map((q) => ({
        question: (q?.question || '').trim(),
        answer: (q?.answer || '').trim(),
      }))
      .filter((q) => q.question && q.answer);

    try {
      const ingredient = await createIngredient.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        image: image?.url || undefined,
        benefits: cleanBenefits.length ? cleanBenefits : undefined,
        uses: cleanUses.length ? cleanUses : undefined,
        faq: cleanFaq.length ? cleanFaq : undefined,
        isIndexable,
        isActive,
      });
      onCreated(ingredient);
    } catch { /* hook toast */ }
  };

  return (
    <>
      <div className="offcanvas-backdrop" onClick={onClose} />
      <aside className="offcanvas-panel">
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Add ingredient</h3>
            <p className="text-xs text-slate-500">Tag products with a canonical ingredient.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center">
            <FiX size={16} />
          </button>
        </header>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-5 space-y-5">
          <Field label="Name" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hyaluronic Acid"
              className={inputCls}
            />
          </Field>

          <CountedField
            label="Meta title"
            hint="≤ 60 chars · drives the /ingredient/:slug SEO page"
            value={metaTitle}
            max={60}
            onChange={setMetaTitle}
            placeholder="Hyaluronic Acid — Skincare Products & Benefits | Stylogist"
          />
          <CountedField
            label="Meta description"
            hint="≤ 160 chars · summary for search engines"
            value={metaDescription}
            max={160}
            onChange={setMetaDescription}
            placeholder="Discover hyaluronic-acid serums, creams and masks that lock in moisture…"
          />

          <Field label="Description" hint="Long-form copy rendered on the ingredient page. Plain text or HTML.">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={`${inputCls} resize-none`}
              placeholder="A humectant that draws and holds water in the skin…"
            />
          </Field>

          <Field
            label="Benefits"
            hint="Bulleted list shown under a 'Benefits' heading on the ingredient page."
          >
            <BulletListEditor
              value={benefits}
              onChange={setBenefits}
              placeholder="Locks in moisture for up to 24 hours"
              addLabel="Add benefit"
            />
          </Field>

          <Field
            label="Uses"
            hint="Bulleted list shown under a 'Uses' heading."
          >
            <BulletListEditor
              value={uses}
              onChange={setUses}
              placeholder="Apply morning and night after toner"
              addLabel="Add use case"
            />
          </Field>

          <Field
            label="FAQ"
            hint="Question + answer pairs shown on the ingredient page and exposed as FAQPage structured data."
          >
            <FaqEditor value={faq} onChange={setFaq} />
          </Field>

          <Field label="Image" hint="Uploaded and stored as webp">
            <UploadHint>
              Recommended <strong>300 × 300&nbsp;px</strong>, transparent or pale background.
            </UploadHint>
            {image ? (
              <div className="mt-2 relative w-28 h-28 rounded-lg overflow-hidden border border-slate-200">
                <img src={image.url} alt="ingredient" width="120" height="120" className="w-full h-full object-contain bg-slate-50" />
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
                    <span className="text-xs text-slate-500">Upload image</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </label>
            )}
          </Field>

          {/* Visibility flags. `isActive` toggles the ingredient on/off in
              filters and dropdowns; `isIndexable` controls whether the
              public /ingredient/:slug page emits a noindex robots tag. */}
          <Field label="Visibility" hint="Active ingredients show up in filters; indexable ingredients are crawled by Google.">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#007074]"
                />
                Active (visible in storefront filters)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isIndexable}
                  onChange={(e) => setIsIndexable(e.target.checked)}
                  className="w-4 h-4 accent-[#007074]"
                />
                Indexable (allow search engines to index the SEO landing page)
              </label>
            </div>
          </Field>
        </form>

        <footer className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={createIngredient.isPending}
            className="px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60 flex items-center gap-2"
          >
            {createIngredient.isPending && <FiLoader className="animate-spin" size={14} />}
            <FiPlus size={14} /> Add ingredient
          </button>
        </footer>
      </aside>
    </>
  );
}
