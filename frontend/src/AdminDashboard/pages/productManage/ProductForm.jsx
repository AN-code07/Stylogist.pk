import React, { useRef } from 'react';
import { FiBox, FiCheckCircle, FiHash, FiLoader, FiPackage, FiRefreshCw, FiTarget } from 'react-icons/fi';
import toast from 'react-hot-toast';
import TiptapEditor from "../../../components/editor/TiptapEditor";
import axiosClient from '../../../api/axiosClient';
import {
  CategoryMultiSelect,
  CountedField,
  Field,
  SearchableSelect,
  SectionTitle,
  SelectInput,
} from './fields';
import MediaUploader from './MediaUploader';
import VariantsEditor from './VariantsEditor';
import BulletListEditor from './BulletListEditor';
import {
  TIPTAP_EXTENSIONS,
  SHORT_TIPTAP_EXTENSIONS,
  transformStandardPaste,
  transformShortPaste,
  inputCls,
  slugify,
  stripHtmlLen,
} from './shared';

export default function ProductForm({
  form,
  setForm,
  editingId,
  categoryTree,
  brands,
  onGenerateSlug,
  onThumbnailUpload,
  onRemoveThumbnail,
  onMediaUpload,
  onRemoveMedia,
  addVariant,
  removeVariant,
  updateVariant,
  onSubmit,
  onCancel,
  submitting,
  uploadingOne,
  uploadingMany,
  onOpenCategory,
  onOpenBrand,
}) {

  // Tiptap image upload handler
  // Note: Your custom <TiptapEditor> component will need to call this function 
  // when its image toolbar button is clicked, passing its internal `editor` instance.
  const handleImageUpload = async (editor) => {
    if (!editor) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('role', 'editor');
        if (form.slug) fd.append('productSlug', form.slug);
        else if (form.name) fd.append('productSlug', slugify(form.name));
        
        if (form.metaTitle) { 
          fd.append('metaTitle', form.metaTitle); 
          fd.append('alt', form.metaTitle); 
        }
        if (form.metaDescription) {
          fd.append('metaDescription', form.metaDescription);
        }

        const { data } = await axiosClient.post('/uploads/image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        const url = data.data.url;
        
        // Tiptap command to insert the image
        editor.chain().focus().setImage({ src: url, alt: 'Uploaded image' }).run();
        
      } catch (err) {
        toast.error(err.response?.data?.message || 'Image upload failed');
      }
    };
    input.click();
  };

  const itemDetails = form.itemDetails || {};
  const setItemDetail = (key, val) =>
    setForm((f) => ({ ...f, itemDetails: { ...(f.itemDetails || {}), [key]: val } }));

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT — core fields */}
      <section className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <SectionTitle icon={<FiPackage size={14} />}>Details</SectionTitle>

        <Field label="Product name" required>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Silk Satin Slip Dress"
            className={inputCls}
          />
        </Field>

        <Field
          label="Slug"
          hint={editingId
            ? 'Leave unchanged to keep the existing slug. Regenerate only if you really need a new URL.'
            : 'Click "Generate slug" to derive one from the product name.'}
        >
          <div className="flex items-stretch gap-2">
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              placeholder="silk-satin-slip-dress"
              className={`${inputCls} flex-1`}
            />
            <button
              type="button"
              onClick={onGenerateSlug}
              className="shrink-0 px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1"
            >
              <FiRefreshCw size={12} /> Generate slug
            </button>
          </div>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CountedField
            label="Meta title"
            hint="≤ 60 chars for Google snippets"
            value={form.metaTitle}
            max={60}
            onChange={(v) => setForm((f) => ({ ...f, metaTitle: v }))}
            placeholder="Silk Satin Slip Dress | Stylogist"
          />
          <CountedField
            label="Meta description"
            hint="≤ 160 chars for Google snippets"
            value={form.metaDescription}
            max={160}
            onChange={(v) => setForm((f) => ({ ...f, metaDescription: v }))}
            placeholder="Featherlight silk slip dress in a minimal silhouette…"
          />
        </div>

        <Field
          label="UPC"
          hint="Universal Product Code — exactly 12 digits. Surfaces as `gtin12` in the JSON-LD Product schema for Google Shopping rich results."
        >
          <div className="relative">
            <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={form.barcode || ''}
              onChange={(e) => {
                const next = (e.target.value || '').replace(/\D/g, '').slice(0, 12);
                setForm((f) => ({ ...f, barcode: next }));
              }}
              placeholder="012345678905"
              maxLength={12}
              inputMode="numeric"
              pattern="\d{12}"
              className={`${inputCls} pl-9 ${
                form.barcode && form.barcode.length !== 12
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : ''
              }`}
            />
            {form.barcode && form.barcode.length > 0 && form.barcode.length !== 12 && (
              <p className="text-[11px] text-red-500 mt-1">
                UPC must be exactly 12 digits ({form.barcode.length}/12).
              </p>
            )}
          </div>
        </Field>

        <Field
          as="div"
          label="Short description"
          hint={`One-line blurb shown in listings · ${stripHtmlLen(form.shortDescription)} chars · bold disabled by design`}
        >
          <div className="bg-white rounded-lg relative border border-slate-200 focus-within:ring-2 focus-within:ring-[#007074]/20 focus-within:border-[#007074] z-20">
            {/* Image upload deliberately omitted from the short description
                — short blurbs should be plain text, never embedded media. */}
            <TiptapEditor
              value={form.shortDescription}
              onChange={(value) => setForm((f) => ({ ...f, shortDescription: value }))}
              extensions={SHORT_TIPTAP_EXTENSIONS}
              editorProps={{ transformPastedHTML: transformShortPaste }}
              placeholder="Featherlight silk in a minimal silhouette..."
              minHeight={80}
            />
          </div>
        </Field>

        <Field
          as="div"
          label="Description"
          required
          hint={`${stripHtmlLen(form.description)} / 300 recommended chars`}
        >
          <div className="bg-white rounded-lg relative border border-slate-200 focus-within:ring-2 focus-within:ring-[#007074]/20 focus-within:border-[#007074] z-10">
            <TiptapEditor
              value={form.description}
              onChange={(value) => setForm((f) => ({ ...f, description: value }))}
              extensions={TIPTAP_EXTENSIONS}
              editorProps={{ transformPastedHTML: transformStandardPaste }}
              placeholder="Write a detailed product description..."
              onImageUpload={handleImageUpload} // Passed to your wrapper
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Benefits"
            hint="Rendered as <ul> under an H2 heading on the product page."
          >
            <BulletListEditor
              value={form.benefits}
              onChange={(next) => setForm((f) => ({ ...f, benefits: next }))}
              placeholder="Strengthens nails and hair"
              addLabel="Add benefit"
            />
          </Field>
          <Field
            label="Uses"
            hint="Rendered as <ul> under an H2 heading on the product page."
          >
            <BulletListEditor
              value={form.uses}
              onChange={(next) => setForm((f) => ({ ...f, uses: next }))}
              placeholder="Take 1 capsule daily after meals"
              addLabel="Add use case"
            />
          </Field>
        </div>

        <Field label="Item details" hint="Structured spec block — surfaces as a table on the product page.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SmallField icon={<FiBox size={12} />} label="Item form">
              <input
                value={itemDetails.itemForm || ''}
                onChange={(e) => setItemDetail('itemForm', e.target.value)}
                placeholder="Capsule"
                className={inputCls}
              />
            </SmallField>
            <SmallField icon={<FiPackage size={12} />} label="Container type">
              <input
                value={itemDetails.containerType || ''}
                onChange={(e) => setItemDetail('containerType', e.target.value)}
                placeholder="Bottle"
                className={inputCls}
              />
            </SmallField>
            <SmallField icon={<FiTarget size={12} />} label="Age range">
              <input
                value={itemDetails.ageRange || ''}
                onChange={(e) => setItemDetail('ageRange', e.target.value)}
                placeholder="Adult"
                className={inputCls}
              />
            </SmallField>
            <SmallField icon={<FiCheckCircle size={12} />} label="Dosage form">
              <input
                value={itemDetails.dosageForm || ''}
                onChange={(e) => setItemDetail('dosageForm', e.target.value)}
                placeholder="Capsule"
                className={inputCls}
              />
            </SmallField>
          </div>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Categories" required>
            <CategoryMultiSelect
              tree={categoryTree}
              selected={form.categories}
              onChange={(next) =>
                setForm((f) => ({ ...f, categories: next, category: next[0] || '' }))
              }
              onAdd={onOpenCategory}
            />
          </Field>
          <Field label="Brand">
            <SearchableSelect
              value={form.brand}
              onChange={(v) => setForm((f) => ({ ...f, brand: v }))}
              options={brands.map((b) => ({ value: b._id, label: b.name }))}
              placeholder="Select brand"
              onAdd={onOpenBrand}
            />
          </Field>
          <Field label="Status">
            <SelectInput
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
              ]}
            />
          </Field>
        </div>

        <div className="pt-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Storefront placement
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <MerchFlag
              label="Featured"
              hint="Shown in Home → Featured Collection"
              checked={form.isFeatured}
              onChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))}
            />
            <MerchFlag
              label="Trending"
              hint="Shown in Home / Deals → Trending Now"
              checked={form.isTrending}
              onChange={(v) => setForm((f) => ({ ...f, isTrending: v }))}
            />
            <MerchFlag
              label="On deal"
              hint="Shown in Deals of the Day"
              checked={form.isDeal}
              onChange={(v) => setForm((f) => ({ ...f, isDeal: v }))}
            />
          </div>
        </div>
      </section>

      {/* RIGHT — media + variants */}
      <section className="lg:col-span-5 space-y-5">
        <MediaUploader
          form={form}
          onThumbnailUpload={onThumbnailUpload}
          onRemoveThumbnail={onRemoveThumbnail}
          onMediaUpload={onMediaUpload}
          onRemoveMedia={onRemoveMedia}
          uploadingOne={uploadingOne}
          uploadingMany={uploadingMany}
        />
        <VariantsEditor
          variants={form.variants}
          addVariant={addVariant}
          removeVariant={removeVariant}
          updateVariant={updateVariant}
        />
      </section>

      {/* Footer spanning both columns */}
      <div className="lg:col-span-12 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting && <FiLoader className="animate-spin" size={16} />}
          {editingId ? 'Update product' : 'Save product'}
        </button>
      </div>
    </form>
  );
}

function SmallField({ icon, label, children }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-slate-600 mb-1 inline-flex items-center gap-1">
        <span className="text-[#007074]">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

function MerchFlag({ label, hint, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`text-left p-3 rounded-lg border transition-colors ${
        checked
          ? 'border-[#007074] bg-[#007074]/5 ring-2 ring-[#007074]/10'
          : 'border-slate-200 hover:border-slate-300 bg-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${checked ? 'text-[#007074]' : 'text-slate-900'}`}>
          {label}
        </span>
        <span
          className={`w-4 h-4 rounded-full border ${
            checked ? 'bg-[#007074] border-[#007074]' : 'border-slate-300'
          }`}
        />
      </div>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </button>
  );
}