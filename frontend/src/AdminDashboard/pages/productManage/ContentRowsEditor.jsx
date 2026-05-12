import React, { useState } from 'react';
import { FiPlus, FiX, FiImage, FiLoader, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useUploadImage } from '../../../features/uploads/useUploadHooks';
import { inputCls } from './shared';

// Editor for the {text, image}[] shape used by benefits / uses on the
// product. Each row is rendered as a self-contained card so it's visually
// obvious that the banner upload belongs to THAT row only — there is no
// shared "one image for all bullets" control here.
//
// Layout per row:
//   ┌───────────────────────────────────────────┐
//   │ #N  [text input]                      [X] │
//   │                                            │
//   │  [   banner preview  ]   [ Upload banner ] │
//   └───────────────────────────────────────────┘
//
// CSV bulk-add (top) is a typed-shortcut for appending many empty-image
// rows — admin can fill banners per-row afterwards. Empty trailing rows
// are dropped at submit time by useProductManage.
export default function ContentRowsEditor({
  value = [],
  onChange,
  placeholder = 'Bullet text',
  addLabel = 'Add row',
  uploadRole = 'banner',
}) {
  const [bulk, setBulk] = useState('');
  const uploadOne = useUploadImage();
  const [uploadingIdx, setUploadingIdx] = useState(null);

  const rows = value.length ? value : [{ text: '', image: '' }];

  const setAt = (idx, patch) => {
    onChange(rows.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const addRow = () => onChange([...rows, { text: '', image: '' }]);

  const removeRow = (idx) => {
    if (rows.length === 1) {
      onChange([]);
      return;
    }
    onChange(rows.filter((_, i) => i !== idx));
  };

  // CSV bulk-import — splits on commas + newlines and appends one empty-
  // banner row per non-empty entry. Banner images are added per-row
  // afterwards via the upload button on each card.
  const importBulk = () => {
    const parts = bulk
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const additions = parts.map((text) => ({ text, image: '' }));
    // Replace empty trailing rows so the bulk import doesn't leave a
    // blank row at the top.
    const trimmed = rows.filter((r) => (r?.text || '').trim());
    onChange([...trimmed, ...additions]);
    setBulk('');
  };

  const handleImageUpload = async (idx, file) => {
    if (!file) return;
    setUploadingIdx(idx);
    try {
      const res = await uploadOne.mutateAsync({ file, role: uploadRole });
      setAt(idx, { image: res.url });
    } catch {
      toast.error('Banner upload failed');
    } finally {
      setUploadingIdx(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* CSV/newline bulk-add. Only fills the TEXT of each row — banner
          images are still uploaded per-row below. */}
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
      <p className="text-[11px] text-slate-400 -mt-1 ml-1">
        Each row below has its <strong>own</strong> banner image — uploads are scoped to that single bullet.
      </p>

      {/* Per-row cards. The banner area on the left + upload button on the
          right make the per-row scope obvious. */}
      {rows.map((row, idx) => (
        <div
          key={idx}
          className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-2 px-3 pt-3">
            <span className="w-6 h-6 rounded-full bg-[#007074]/10 text-[#007074] text-[11px] font-bold flex items-center justify-center shrink-0">
              {idx + 1}
            </span>
            <input
              value={row.text || ''}
              onChange={(e) => setAt(idx, { text: e.target.value })}
              placeholder={placeholder}
              aria-label={`Row ${idx + 1} text`}
              className={`${inputCls} flex-1`}
            />
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="text-slate-400 hover:text-red-600 p-2"
              aria-label={`Remove row ${idx + 1}`}
            >
              <FiX size={14} />
            </button>
          </div>

          {/* Banner row — explicit "for row N" labelling so the admin
              never wonders whether the upload is scoped to this entry. */}
          <div className="px-3 pb-3 pt-2 mt-2 border-t border-slate-100 bg-slate-50/40 flex items-center gap-3 flex-wrap">
            <div className="w-28 h-16 rounded-md bg-white border border-slate-200 overflow-hidden flex items-center justify-center text-slate-300 shrink-0">
              {row.image ? (
                // eslint-disable-next-line jsx-a11y/img-redundant-alt
                <img src={row.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <FiImage size={18} />
              )}
            </div>
            <div className="flex-1 min-w-40">
              <p className="text-[11px] font-semibold text-slate-600 mb-1">
                Banner for row {idx + 1}{' '}
                <span className="text-slate-400 font-normal">(optional)</span>
              </p>
              <label
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  row.image
                    ? 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                    : 'bg-[#007074] text-white hover:bg-[#005a5d]'
                }`}
              >
                {uploadingIdx === idx ? (
                  <FiLoader className="animate-spin" size={12} />
                ) : (
                  <FiUpload size={12} />
                )}
                {row.image ? 'Replace banner' : 'Upload banner'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(idx, e.target.files?.[0])}
                  aria-label={`Upload banner for row ${idx + 1}`}
                />
              </label>
              {row.image && (
                <button
                  type="button"
                  onClick={() => setAt(idx, { image: '' })}
                  className="ml-2 text-[11px] text-slate-500 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="text-xs font-medium text-[#007074] hover:underline flex items-center gap-1"
      >
        <FiPlus size={12} /> {addLabel}
      </button>
    </div>
  );
}
