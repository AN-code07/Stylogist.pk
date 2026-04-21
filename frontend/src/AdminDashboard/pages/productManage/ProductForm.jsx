import React, { useMemo, useRef } from 'react';
import { FiLoader, FiPackage, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
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
import {
  FONT_WHITELIST,
  QUILL_FORMATS,
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
  const descriptionRef = useRef(null);
  const shortRef = useRef(null);

  const uploadQuillImage = async (editorRef) => {
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
        if (form.metaTitle) { fd.append('metaTitle', form.metaTitle); fd.append('alt', form.metaTitle); }
        if (form.metaDescription) fd.append('metaDescription', form.metaDescription);
        const { data } = await axiosClient.post('/uploads/image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const url = data.data.url;
        const editor = editorRef.current?.getEditor();
        if (!editor) return;
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, 'image', url, 'user');
        editor.setSelection(range.index + 1);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Image upload failed');
      }
    };
    input.click();
  };

  const descriptionModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, false] }],
        [{ font: FONT_WHITELIST }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      handlers: { image: () => uploadQuillImage(descriptionRef) },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [form.slug, form.name, form.metaTitle, form.metaDescription]);

  const shortModules = useMemo(() => ({
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['image'],
        ['clean'],
      ],
      handlers: { image: () => uploadQuillImage(shortRef) },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [form.slug, form.name, form.metaTitle, form.metaDescription]);

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT — core fields */}
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

        <Field
          label="Slug"
          hint={editingId
            ? 'Leave unchanged to keep the existing slug. Regenerate only if you really need a new URL.'
            : 'Click "Generate slug" to derive one from the product name.'}
        >
          <div className="flex items-stretch gap-2">
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
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
            hint="For search engines"
            value={form.metaTitle}
            max={67}
            onChange={(v) => setForm({ ...form, metaTitle: v })}
            placeholder="Silk Satin Slip Dress | Stylogist"
          />
          <CountedField
            label="Meta description"
            hint="For search engines"
            value={form.metaDescription}
            max={160}
            onChange={(v) => setForm({ ...form, metaDescription: v })}
            placeholder="Featherlight silk slip dress in a minimal silhouette…"
          />
        </div>

        <Field
          label="Short description"
          hint={`One-line blurb shown in listings · ${stripHtmlLen(form.shortDescription)} chars`}
        >
          <div className="bg-white rounded-lg relative border border-slate-200 focus-within:ring-2 focus-within:ring-[#007074]/20 focus-within:border-[#007074] z-20">
            <ReactQuill
              ref={shortRef}
              theme="snow"
              value={form.shortDescription}
              onChange={(value) => setForm({ ...form, shortDescription: value })}
              modules={shortModules}
              placeholder="Featherlight silk in a minimal silhouette..."
              className="short-quill"
            />
          </div>
        </Field>

        <Field
          label="Description"
          required
          hint={`${stripHtmlLen(form.description)} / 300 recommended chars`}
        >
          <div className="bg-white rounded-lg relative border border-slate-200 focus-within:ring-2 focus-within:ring-[#007074]/20 focus-within:border-[#007074] z-10">
            <ReactQuill
              ref={descriptionRef}
              theme="snow"
              value={form.description}
              onChange={(value) => setForm({ ...form, description: value })}
              modules={descriptionModules}
              formats={QUILL_FORMATS}
              placeholder="Write a detailed product description..."
              className="quill-editor"
            />
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
              onChange={(v) => setForm({ ...form, status: v })}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
              ]}
            />
          </Field>
        </div>

        {/* Merchandising rails — drive the Home page sections. Keep in sync
            with FeaturedProducts / TrendingProducts / DealsOfDay consumers. */}
        <div className="pt-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Storefront placement
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <MerchFlag
              label="Featured"
              hint="Shown in Home → Featured Collection"
              checked={form.isFeatured}
              onChange={(v) => setForm({ ...form, isFeatured: v })}
            />
            <MerchFlag
              label="Trending"
              hint="Shown in Home / Deals → Trending Now"
              checked={form.isTrending}
              onChange={(v) => setForm({ ...form, isTrending: v })}
            />
            <MerchFlag
              label="On deal"
              hint="Shown in Deals of the Day"
              checked={form.isDeal}
              onChange={(v) => setForm({ ...form, isDeal: v })}
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

// Segmented flag toggle: click-to-activate, shows an accent border + check
// dot when active. Used for the Featured / Trending / Deal merchandising
// rails so admins can tag a product into a home section in one click.
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

