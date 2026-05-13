import React, { useRef, useState } from 'react';
import {
  FiBox, FiCheckCircle, FiHash, FiLoader, FiPackage,
  FiRefreshCw, FiTarget, FiMessageSquare, FiPlus, FiX, FiStar,
  FiChevronDown
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import TiptapEditor from "../../../components/editor/TiptapEditor";
import axiosClient from '../../../api/axiosClient';
import {
  CategoryMultiSelect,
  CountedField,
  Field,
  SearchableMultiSelect,
  SearchableSelect,
  SectionTitle,
  SelectInput,
} from './fields';
import MediaUploader from './MediaUploader';
import VariantsEditor from './VariantsEditor';
import BulletListEditor from './BulletListEditor';
import FaqEditor from './FaqEditor';
import HowToUseBlockEditor from './HowToUseBlockEditor';
import WhyLoveItEditor from './WhyLoveItEditor';
import SectionBlockEditor from './SectionBlockEditor';
import {
  TIPTAP_EXTENSIONS,
  SHORT_TIPTAP_EXTENSIONS,
  transformStandardPaste,
  transformShortPaste,
  inputCls,
  slugify,
  stripHtmlLen,
} from './shared';

// Import the review hook (verify this path matches your project structure)
import { useAdminCreateReview } from '../../../features/reviews/useReviewHooks';

export default function ProductForm({
  form,
  setForm,
  editingId,
  categoryTree,
  brands,
  ingredients = [],
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
  onOpenIngredient,
}) {
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Tiptap image upload handler
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
    <>
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
              max={65}
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
            label="Global product identifier"
            hint="Optional. Pick the type and enter the matching code. Surfaces as the right schema.org property (gtin12 / gtin13 / isbn) in the JSON-LD Product schema."
          >
            <GtinPicker
              type={form.gtinType || ''}
              value={form.barcode || ''}
              onTypeChange={(t) => {
                // Switching types resets the value so we never persist a
                // 12-digit code with `ean` set, etc.
                setForm((f) => ({ ...f, gtinType: t, barcode: '' }));
              }}
              onValueChange={(v) => setForm((f) => ({ ...f, barcode: v }))}
            />
          </Field>

          <Field
            as="div"
            label="Short description"
            hint={`One-line blurb shown in listings · ${stripHtmlLen(form.shortDescription)} chars · bold disabled by design`}
          >
            <div className="bg-white rounded-lg relative border border-slate-200 focus-within:ring-2 focus-within:ring-[#007074]/20 focus-within:border-[#007074] z-20">
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
                onImageUpload={handleImageUpload}
              />
            </div>
          </Field>

          {/* Benefits + uses each have a SINGLE banner image for the whole
              section (same pattern as How-to-use / Ingredient highlight) plus
              a plain bullet list below. Stored as { image, items: string[] }. */}
          <Field
            as="div"
            label="Benefits"
            hint="Optional banner image for the whole section, plus a bullet list."
          >
            <SectionBlockEditor
              value={form.benefits}
              onChange={(next) => setForm((f) => ({ ...f, benefits: next }))}
              productSlug={form.slug || form.name}
              uploadRole="benefits-banner"
              placeholder="Strengthens nails and hair"
              addLabel="Add benefit"
            />
          </Field>
          <Field
            as="div"
            label="Uses"
            hint="Optional banner image for the whole section, plus a bullet list."
          >
            <SectionBlockEditor
              value={form.uses}
              onChange={(next) => setForm((f) => ({ ...f, uses: next }))}
              productSlug={form.slug || form.name}
              uploadRole="uses-banner"
              placeholder="Take 1 capsule daily after meals"
              addLabel="Add use case"
            />
          </Field>

          {/* Standalone "How to use" block — short rich-text body + a
              single optional banner image. Distinct from the Uses bullet
              list: this is the long-form how-to copy that surfaces under
              its own H2 on the product page. */}
          <Field
            as="div"
            label="How to use"
            hint="Short rich-text instructions shown on the product page. The image renders as a full-width banner above the copy."
          >
            <HowToUseBlockEditor
              value={form.howToUse}
              onChange={(next) => setForm((f) => ({ ...f, howToUse: next }))}
              productSlug={form.slug || form.name}
            />
          </Field>

          {/* Ingredient highlight — same shape as howToUse. Use this to
              showcase a hero ingredient with a banner image + short copy.
              The PDP renders it between the description and the howToUse
              block when populated. */}
          <Field
            as="div"
            label="Ingredient highlight"
            hint="Optional. Banner image + short rich-text copy that calls out a hero ingredient or formulation note."
          >
            <HowToUseBlockEditor
              value={form.ingredientHighlight}
              onChange={(next) =>
                setForm((f) => ({ ...f, ingredientHighlight: next }))
              }
              productSlug={form.slug || form.name}
            />
          </Field>

          {/* "Why customers love it" — visual benefit cards. Each row =
              icon (emoji) + title + short body. Rendered as an icon-card
              grid on the product page so the benefits are scannable on
              mobile instead of buried in a bullet list. */}
          <Field
            label="Why customers love it"
            hint="Icon-card grid above the description — outcome-focused. Leave empty to hide the section."
          >
            <WhyLoveItEditor
              value={form.whyLoveIt}
              onChange={(next) => setForm((f) => ({ ...f, whyLoveIt: next }))}
            />
          </Field>

          {/* Precautions / safety — required by supplement YMYL guidance.
              Rendered in a visually-distinct warning block on the PDP. */}
          <Field
            label="Precautions"
            hint="Safety warnings (one per line). Rendered as a highlighted bullet block on the product page."
          >
            <BulletListEditor
              value={form.precautions}
              onChange={(next) => setForm((f) => ({ ...f, precautions: next }))}
              placeholder="Consult your doctor before use if pregnant or nursing"
              addLabel="Add precaution"
            />
          </Field>

          {/* Storage / shelf-life copy — surfaces in the spec table. */}
          <Field
            label="Storage instructions"
            hint='e.g. "Store in a cool, dry place. Keep out of reach of children."'
          >
            <input
              value={form.storage || ''}
              onChange={(e) => setForm((f) => ({ ...f, storage: e.target.value }))}
              placeholder="Store in a cool, dry place. Keep out of reach of children."
              className={inputCls}
            />
          </Field>

          {/* Tax / GST — applied on top of the sale price in the PDP order
              summary. 0 hides the line entirely (tax-inclusive products). */}
          <Field
            label="Tax / GST percentage"
            hint="Surfaces as a separate line in the order summary on the product page. Set 0 for tax-inclusive prices."
          >
            <div className="flex items-center gap-2 max-w-50">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.taxPercent ?? 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    taxPercent: e.target.value === '' ? 0 : Number(e.target.value),
                  }))
                }
                className={inputCls}
              />
              <span className="text-sm text-slate-500 font-medium">%</span>
            </div>
          </Field>

          {/* FAQ — surfaces as an accordion on the product page and emits
              Schema.org FAQPage JSON-LD for rich-result eligibility.
              Empty rows are dropped before submit. */}
          <Field
            label="FAQ"
            hint="Question + answer pairs shown on the product page and exposed as FAQPage structured data."
          >
            <FaqEditor
              value={form.faq}
              onChange={(next) => setForm((f) => ({ ...f, faq: next }))}
            />
          </Field>

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
            <Field
              label="Manufacturer"
              hint="Producing entity, e.g. “Nature's Bounty Co. — USA”. Surfaces on the product page and in Product schema."
            >
              <input
                value={form.manufacturer || ''}
                onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
                maxLength={120}
                placeholder="e.g. Nature's Bounty Co. — USA"
                aria-label="Manufacturer"
                className={inputCls}
              />
            </Field>
            <Field
              as="div"
              label="Ingredients"
              hint=""
            >
              <SearchableMultiSelect
                value={form.ingredients || []}
                onChange={(next) => setForm((f) => ({ ...f, ingredients: next }))}
                options={ingredients.map((i) => ({ value: i._id, label: i.name }))}
                placeholder="Search ingredients…"
                onAdd={onOpenIngredient}
                addLabel="New ingredient"
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

        {/* RIGHT — media + variants + reviews */}
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

          {/* Reviews Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <SectionTitle icon={<FiMessageSquare size={14} />}>Reviews</SectionTitle>
            
            {editingId ? (
              <div className="mt-4 flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                <p className="text-sm text-slate-500 mb-3 text-center">
                  Quick-add a customer review for this specific product.
                </p>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm"
                >
                  <FiPlus size={14} /> Add Review
                </button>
              </div>
            ) : (
              <div className="mt-4 p-4 text-center border border-slate-100 rounded-lg bg-slate-50">
                <p className="text-sm text-slate-500">
                  Save this product first to add custom reviews.
                </p>
              </div>
            )}
          </div>
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

      {/* Modal renders outside the form to prevent accidental submissions */}
      {showReviewModal && (
        <QuickReviewModal
          productId={editingId}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </>
  );
}

/* ------------ Subcomponents ------------ */

// GTIN picker — type dropdown + dynamic input. Keeps the value masked
// according to the selected type:
//   upc  → 12 digits (digits-only mask)
//   ean  → 13 digits (digits-only mask)
//   isbn → 9 digits + check digit (0–9 or X). We let the trailing X
//          through but keep the body strictly numeric.
const GTIN_OPTIONS = [
  { value: 'upc', label: 'GTIN-12 → UPC' },
  { value: 'ean', label: 'GTIN-13 → EAN (international retail)' },
  { value: 'isbn', label: 'GTIN-10 → ISBN (books)' },
];

const GTIN_RULES = {
  upc: { length: 12, placeholder: '012345678905', describe: 'Universal Product Code — exactly 12 digits.' },
  ean: { length: 13, placeholder: '4006381333931', describe: 'European Article Number — exactly 13 digits.' },
  isbn: { length: 10, placeholder: '0306406152', describe: 'ISBN-10 — 9 digits + a check digit (0–9 or X).' },
};

function GtinPicker({ type, value, onTypeChange, onValueChange }) {
  const rule = GTIN_RULES[type];

  // Per-type input mask. ISBN's last position accepts X; everything
  // else is digits-only. Trailing characters past the rule length are
  // sliced off so the user can't paste an over-long string.
  const handleInput = (raw) => {
    if (!type) return; // input is disabled, this branch is defensive only
    if (type === 'isbn') {
      // Strip everything but digits + (uppercase) X. Cap at 10 chars.
      const cleaned = raw
        .toUpperCase()
        .replace(/[^0-9X]/g, '')
        .slice(0, 10);
      onValueChange(cleaned);
      return;
    }
    const digits = raw.replace(/\D/g, '').slice(0, rule.length);
    onValueChange(digits);
  };

  // Live validity check used to colour the input + render the error line.
  const isInvalid =
    !!value &&
    (!type ||
      (type === 'upc' && !/^\d{12}$/.test(value)) ||
      (type === 'ean' && !/^\d{13}$/.test(value)) ||
      (type === 'isbn' && !/^\d{9}[\dX]$/.test(value)));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-[260px_1fr] gap-2">
        <div className="relative">
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            className={`${inputCls} appearance-none pr-9 cursor-pointer`}
          >
            <option value="">Select identifier type…</option>
            {GTIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <FiChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
        <div className="relative">
          <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            value={value}
            onChange={(e) => handleInput(e.target.value)}
            placeholder={type ? rule.placeholder : 'Pick a type first'}
            disabled={!type}
            inputMode={type === 'isbn' ? 'text' : 'numeric'}
            maxLength={type ? rule.length : undefined}
            className={`${inputCls} pl-9 disabled:bg-slate-50 disabled:text-slate-400 ${
              isInvalid ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
            }`}
          />
        </div>
      </div>
      {type && (
        <p className="text-[11px] text-slate-500">
          {rule.describe}
          {value && (
            <span className={`ml-2 tabular-nums ${isInvalid ? 'text-red-500' : 'text-emerald-600'}`}>
              {value.length}/{rule.length}
            </span>
          )}
        </p>
      )}
      {value && !type && (
        <p className="text-[11px] text-red-500">Select an identifier type so we can validate this code.</p>
      )}
      {isInvalid && type && (
        <p className="text-[11px] text-red-500">
          {type === 'upc' && 'UPC must be exactly 12 digits.'}
          {type === 'ean' && 'EAN must be exactly 13 digits.'}
          {type === 'isbn' && 'ISBN-10 must be 10 characters: 9 digits + check digit (0–9 or X).'}
        </p>
      )}
    </div>
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

/* ------------ Quick Review Modal ------------ */

function QuickReviewModal({ productId, onClose }) {
  const createMut = useAdminCreateReview();
  
  const [form, setForm] = useState({
    rating: 5,
    comment: '',
    status: 'approved',
    displayName: '',
  });

  const canSubmit = !createMut.isPending && form.rating >= 1 && form.rating <= 5;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await createMut.mutateAsync({
        product: productId, // Locked to the current product ID
        rating: Number(form.rating),
        comment: form.comment.trim() || undefined,
        status: form.status,
        displayName: form.displayName.trim() || undefined,
      });
      toast.success("Review added successfully");
      onClose();
    } catch (err) { 
      // Error handling is likely already caught by your hook setup, 
      // but you can add custom error logic here if needed.
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div 
        className="relative bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()} 
      >
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#007074] text-white flex items-center justify-center">
              <FiPlus size={16} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Add product review</h3>
              <p className="text-xs text-slate-500 mt-0.5">Will be attached to this product immediately.</p>
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

        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4">
          
          {/* Rating */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 inline-block">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, rating: n }))}
                  className={`p-1.5 rounded-md hover:bg-slate-50 ${
                    n <= form.rating ? 'text-amber-400' : 'text-slate-300'
                  }`}
                >
                  <FiStar size={20} className={n <= form.rating ? 'fill-amber-400' : ''} />
                </button>
              ))}
              <span className="ml-2 text-xs text-slate-500">{form.rating} / 5</span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 inline-block">Comment</label>
            <textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              rows={4}
              maxLength={2000}
              placeholder="e.g. Great quality and fits perfectly!"
              className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074] resize-none"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 inline-block">
              Display name <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="e.g. Sarah J."
              maxLength={80}
              className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 inline-block">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {['pending', 'approved', 'flagged'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className={`px-3 py-2 rounded-md border text-xs font-medium capitalize transition-colors ${
                    form.status === s
                      ? 'bg-[#007074] text-white border-[#007074]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#007074] hover:text-[#007074]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </form>

        <footer className="border-t border-slate-100 p-4 flex items-center justify-end gap-2 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {createMut.isPending && <FiLoader className="animate-spin" size={14} />}
            Post review
          </button>
        </footer>
      </div>
    </div>
  );
}