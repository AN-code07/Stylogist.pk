import React from 'react';
import { FiX, FiUploadCloud, FiLoader } from 'react-icons/fi';
import TiptapEditor from '../../../components/editor/TiptapEditor';
import { SHORT_TIPTAP_EXTENSIONS, transformShortPaste } from './shared';
import { useUploadImage } from '../../../features/uploads/useUploadHooks';
import { slugify } from './shared';

// "How to use" block — single rich-text body + a single image upload
// underneath. Mirrors the short-description editor styling so admins
// have a consistent feel between the two short copy fields. Output
// shape: { text: <html>, image: <secure_url> }.
//
// Image uploads route through the same `useUploadImage` hook that
// powers thumbnails / gallery / FAQ images, so they land on Cloudinary
// via the configured webp pipeline.
export default function HowToUseBlockEditor({ value, onChange, productSlug = '' }) {
  const data = value && typeof value === 'object'
    ? { text: value.text || '', image: value.image || '' }
    : { text: '', image: '' };

  const upload = useUploadImage();

  const setText = (text) => onChange({ ...data, text });
  const setImage = (image) => onChange({ ...data, image });

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await upload.mutateAsync({
        file,
        productSlug: slugify(productSlug || 'how-to-use') || 'how-to-use',
        slug: `${slugify(productSlug || 'how-to-use') || 'how-to-use'}-how-to-use`,
        role: 'image',
      });
      setImage(res.url);
    } catch {
      // Hook already toasts the failure — no extra action needed.
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg relative border border-slate-200 focus-within:ring-2 focus-within:ring-[#007074]/20 focus-within:border-[#007074]">
        <TiptapEditor
          value={data.text}
          onChange={setText}
          extensions={SHORT_TIPTAP_EXTENSIONS}
          editorProps={{ transformPastedHTML: transformShortPaste }}
          placeholder="Apply a thin layer to clean, dry skin morning and night…"
          minHeight={120}
        />
      </div>

      <div className="flex items-start gap-3">
        {data.image ? (
          <div className="relative w-32 h-32 rounded-md overflow-hidden border border-slate-200 flex-shrink-0">
            <img src={data.image} alt="How to use" className="w-full h-full object-cover" />
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
          <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-200 rounded-md cursor-pointer hover:bg-slate-50 hover:border-[#007074] transition-colors flex-shrink-0">
            {upload.isPending ? (
              <FiLoader className="animate-spin text-[#007074]" size={20} />
            ) : (
              <>
                <FiUploadCloud size={20} className="text-[#007074] mb-1" />
                <span className="text-[10px] text-slate-500 leading-none">Upload image</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="hidden"
            />
          </label>
        )}
        <p className="text-[11px] text-slate-400 leading-relaxed flex-1">
          Optional. Stored on Cloudinary as webp. Recommended <strong>≥ 600&nbsp;px</strong>
          {' '}wide. Renders next to the text on the product page.
        </p>
      </div>
    </div>
  );
}
