import React from 'react';
import { FiPlus, FiX, FiUploadCloud, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useUploadImage } from '../../../features/uploads/useUploadHooks';
import { inputCls, slugify } from './shared';

// "How to use" step editor. Each row is `{ text, image }`:
//   - `text` is the instruction, surfaced in the storefront list as
//     numbered step copy.
//   - `image` is an optional thumbnail uploaded through the same webp
//     pipeline as everything else — stored as a public URL.
//
// We accept legacy plain-string entries gracefully too: the parent
// (`useProductManage`) hydrates them into `{text, image: ''}` on edit, so
// this component only ever sees structured rows.
export default function HowToUseEditor({ value = [], onChange, productSlug = '' }) {
  const items = value.length ? value : [{ text: '', image: '' }];
  const upload = useUploadImage();

  const setAt = (idx, patch) => {
    onChange(items.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const addRow = () => onChange([...items, { text: '', image: '' }]);

  const removeRow = (idx) => {
    if (items.length === 1) {
      onChange([]);
      return;
    }
    onChange(items.filter((_, i) => i !== idx));
  };

  const handleImageUpload = async (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await upload.mutateAsync({
        file,
        productSlug: slugify(productSlug || 'how-to-use') || 'how-to-use',
        role: 'image',
        index: idx + 1,
      });
      setAt(idx, { image: res.url });
    } catch {
      // The upload hook already toasts the failure — no need to re-toast.
    }
    e.target.value = '';
  };

  const clearImage = (idx) => setAt(idx, { image: '' });

  return (
    <div className="space-y-3">
      {items.map((row, idx) => (
        <div
          key={idx}
          className="border border-slate-200 rounded-lg p-3 bg-white space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <span className="w-5 h-5 rounded-full bg-[#007074]/10 text-[#007074] flex items-center justify-center font-bold">
                {idx + 1}
              </span>
              Step {idx + 1}
            </span>
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="text-slate-400 hover:text-red-600 p-1"
              aria-label="Remove step"
            >
              <FiX size={14} />
            </button>
          </div>

          <input
            value={row.text}
            onChange={(e) => setAt(idx, { text: e.target.value })}
            placeholder="e.g. Apply a thin layer to clean, dry skin"
            className={inputCls}
          />

          <div className="flex items-start gap-3">
            {row.image ? (
              <div className="relative w-24 h-24 rounded-md overflow-hidden border border-slate-200 flex-shrink-0">
                <img
                  src={row.image}
                  alt={`Step ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => clearImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 text-slate-600 flex items-center justify-center shadow"
                  aria-label="Remove image"
                >
                  <FiX size={10} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-slate-200 rounded-md cursor-pointer hover:bg-slate-50 hover:border-[#007074] transition-colors flex-shrink-0">
                {upload.isPending ? (
                  <FiLoader className="animate-spin text-[#007074]" size={18} />
                ) : (
                  <>
                    <FiUploadCloud size={18} className="text-[#007074] mb-1" />
                    <span className="text-[10px] text-slate-500 leading-none">Image</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(idx, e)}
                  className="hidden"
                />
              </label>
            )}
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Optional. Adds a thumbnail next to this step on the product page.
              Stored as webp. Recommended <strong>≥ 400&nbsp;px</strong> wide.
            </p>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="text-xs font-medium text-[#007074] hover:underline flex items-center gap-1"
      >
        <FiPlus size={12} /> Add step
      </button>
    </div>
  );
}
