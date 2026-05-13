import React, { useState } from 'react';
import { FiX, FiUploadCloud, FiLoader } from 'react-icons/fi';
import { useUploadImage } from '../../../features/uploads/useUploadHooks';
import { inputCls, slugify } from './shared';
import BulletListEditor from './BulletListEditor';

// Section block editor for Benefits / Uses: a SINGLE banner image at the
// top + a flat bullet list below. Mirrors HowToUseBlockEditor's banner
// affordance and BulletListEditor's row editing — admins get one image
// per section instead of one image per bullet. The CSV/newline bulk-add
// strip is retained from the previous ContentRowsEditor so admins can
// paste a long list and let it append as bullets.
//
// Output shape: { image: <secure_url>, items: <string[]> }.
export default function SectionBlockEditor({
  value,
  onChange,
  productSlug = '',
  uploadRole = 'banner',
  placeholder,
  addLabel = 'Add bullet',
}) {
  const data =
    value && typeof value === 'object' && !Array.isArray(value)
      ? { image: value.image || '', items: Array.isArray(value.items) ? value.items : [] }
      : { image: '', items: [] };

  const upload = useUploadImage();
  const [bulk, setBulk] = useState('');

  const setImage = (image) => onChange({ ...data, image });
  const setItems = (items) => onChange({ ...data, items });

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base = slugify(productSlug || 'section') || 'section';
    try {
      const res = await upload.mutateAsync({
        file,
        productSlug: base,
        slug: `${base}-${uploadRole}`,
        role: uploadRole,
      });
      setImage(res.url);
    } catch {
      // useUploadImage already toasts the failure.
    }
    e.target.value = '';
  };

  // Comma/newline bulk-add. Splits the buffer, drops empties, appends
  // to the existing bullets (after trimming any blank trailing rows so
  // a paste doesn't leave a stray empty bullet above the new ones).
  const importBulk = () => {
    const parts = bulk
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const trimmed = (data.items || []).filter((s) => (s || '').trim());
    setItems([...trimmed, ...parts]);
    setBulk('');
  };

  return (
  <div className="space-y-3">

    {/* CSV / newline bulk-add */}
    <div className="flex items-start gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
      <input
        value={bulk}
        onChange={(e) => setBulk(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            importBulk();
          }
        }}
        placeholder='Paste a comma- or newline-separated list, e.g. "Better sleep, Muscle recovery"'
        className={`${inputCls} flex-1`}
      />

      <button
        type="button"
        onClick={importBulk}
        className="shrink-0 px-3 py-2.5 bg-[#007074] text-white rounded-lg text-xs font-medium hover:bg-[#005a5d]"
      >
        Add CSV
      </button>
    </div>

    {/* Bullet Editor */}
    <BulletListEditor
      value={data.items}
      onChange={setItems}
      placeholder={placeholder}
      addLabel={addLabel}
    />

    {/* Image Upload Section */}
    <div className="flex items-start gap-3">
      {data.image ? (
        <div className="relative w-32 h-32 rounded-md overflow-hidden border border-slate-200 shrink-0">
          <img
            src={data.image}
            alt="Section banner"
            className="w-full h-full object-cover"
          />

          <button
            type="button"
            onClick={() => setImage('')}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-slate-600 flex items-center justify-center shadow"
            aria-label="Remove image"
          >
            <FiX size={12} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-200 rounded-md cursor-pointer hover:bg-slate-50 hover:border-[#007074] transition-colors shrink-0">
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="hidden"
          />

          {upload.isPending ? (
            <FiLoader className="animate-spin text-[#007074]" size={20} />
          ) : (
            <>
              <FiUploadCloud
                size={20}
                className="text-[#007074] mb-1"
              />

              <span className="text-[10px] text-slate-500 leading-none">
                Upload banner
              </span>
            </>
          )}
        </label>
      )}

      <p className="text-[11px] text-slate-400 leading-relaxed flex-1">
        Optional banner for the whole section. Stored on Cloudinary as webp.
        Recommended <strong>≥ 1200 px</strong> wide — renders full-width
        above the bullets on the product page.
      </p>
    </div>
  </div>
);
}
