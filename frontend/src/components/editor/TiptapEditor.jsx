import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiBold, FiItalic, FiUnderline, FiList, FiAlignLeft, FiAlignCenter,
  FiAlignRight, FiAlignJustify, FiLink, FiImage, FiRotateCcw, FiRotateCw,
  FiType, FiChevronDown, FiCode
} from "react-icons/fi";

// Mirror of FONT_WHITELIST in shared.js. The dropdown lets the admin pick a
// CSS-stack-friendly family — TextStyle + FontFamily extensions handle the
// inline `style="font-family: …"` plumbing.
const FONT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'sans-serif', label: 'Sans Serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'monospace', label: 'Monospace' },
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: 'Poppins, system-ui, sans-serif', label: 'Poppins' },
  { value: 'Playfair Display, serif', label: 'Playfair' },
  { value: 'Roboto, system-ui, sans-serif', label: 'Roboto' },
  { value: 'Lora, serif', label: 'Lora' },
];

const HEADING_OPTIONS = [
  { value: 'p', label: 'Paragraph' },
  { value: 'h1', label: 'Heading 1' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
  { value: 'h4', label: 'Heading 4' },
  { value: 'h5', label: 'Heading 5' },
  { value: 'h6', label: 'Heading 6' },
];

/**
 * WordPress-style TipTap editor.
 *
 * Props:
 *   value, onChange      — controlled HTML string
 *   extensions           — array of TipTap extensions (defaults to a no-op StarterKit)
 *   editorProps          — passed to TipTap's `editorProps` (e.g. transformPastedHTML)
 *   placeholder          — visible when the document is empty
 *   onImageUpload(editor)— called when the toolbar Image button is clicked.
 *                          Only renders the button when this prop is provided.
 *   minHeight            — content area min-height (default 220px)
 */
export default function TiptapEditor({
  value,
  onChange,
  extensions,
  editorProps,
  placeholder = 'Start typing…',
  onImageUpload,
  minHeight = 220,
}) {
  // Tracks the HTML the editor itself last emitted. When the controlled
  // `value` prop matches this, the change originated from typing inside the
  // editor and we MUST NOT call `setContent` — doing so resets the caret
  // and breaks input. Only external mutations (edit-product hydration,
  // programmatic resets) cause a sync.
  const lastEmitted = useRef(value || '');

  const editor = useEditor({
    extensions: extensions || [],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'tiptap prose prose-sm max-w-none focus:outline-none px-4 py-3',
      },
      ...(editorProps || {}),
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      // Tiptap returns "<p></p>" for an empty doc — normalise to '' so
      // controlled state matches what the form expects.
      const normalised = html === '<p></p>' ? '' : html;
      lastEmitted.current = normalised;
      onChange(normalised);
    },
  });

  // External `value` sync — only runs when the change is NOT from the
  // editor itself. Compare against the ref (cheap, doesn't depend on
  // `editor.getHTML()` which may reformat whitespace).
  useEffect(() => {
    if (!editor) return;
    const next = value || '';
    if (next === lastEmitted.current) return;
    lastEmitted.current = next;
    // `false` = don't fire onUpdate again, otherwise we'd loop.
    editor.commands.setContent(next, false);
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-lg overflow-hidden">
      <Toolbar editor={editor} onImageUpload={onImageUpload} />
      <div className="relative bg-white">
        <EditorContent editor={editor} style={{ minHeight }} />
        {/* Inline placeholder. We don't have @tiptap/extension-placeholder
            installed, so this overlay shows when the doc is empty and is
            click-through (pointer-events-none) so it never steals focus. */}
        {editor.isEmpty && (
          <div className="pointer-events-none absolute top-3 left-4 text-sm text-slate-400">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------- Toolbar -------------------------- */

function Toolbar({ editor, onImageUpload }) {
  // Heading dropdown reflects the current selection.
  const activeHeading = useMemo(() => {
    if (editor.isActive('paragraph')) return 'p';
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive('heading', { level: i })) return `h${i}`;
    }
    return 'p';
  }, [editor.state]);

  const onHeadingChange = (e) => {
    const v = e.target.value;
    if (v === 'p') {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = Number(v.replace('h', ''));
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  // Font family — only shown when the FontFamily extension is loaded.
  const hasFontFamily = !!editor.extensionManager?.extensions?.find?.(
    (e) => e.name === 'fontFamily'
  );
  const currentFont = editor.getAttributes('textStyle')?.fontFamily || '';
  const onFontChange = (e) => {
    const v = e.target.value;
    if (!v) editor.chain().focus().unsetFontFamily().run();
    else editor.chain().focus().setFontFamily(v).run();
  };

  const promptLink = () => {
    const previous = editor.getAttributes('link').href || '';
    const url = window.prompt('Enter URL', previous);
    if (url === null) return; // cancelled
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank', rel: 'noopener noreferrer' }).run();
  };

  // Feature detection — only render buttons whose extensions are loaded.
  const has = (name) => !!editor.extensionManager?.extensions?.find?.((e) => e.name === name);

  return (
    <div className="flex items-center flex-wrap gap-1 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
      {has('heading') && (
        <Select value={activeHeading} onChange={onHeadingChange} title="Paragraph style" icon={<FiType size={12} />}>
          {HEADING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      )}

      {hasFontFamily && (
        <Select value={currentFont} onChange={onFontChange} title="Font family">
          {FONT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} style={{ fontFamily: o.value || 'inherit' }}>
              {o.label}
            </option>
          ))}
        </Select>
      )}

      <Divider />

      {has('bold') && (
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <FiBold size={14} />
        </Btn>
      )}
      {has('italic') && (
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
          <FiItalic size={14} />
        </Btn>
      )}
      {has('underline') && (
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
          <FiUnderline size={14} />
        </Btn>
      )}
      {has('strike') && (
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <span className="text-[13px] font-semibold line-through">S</span>
        </Btn>
      )}
      {has('code') && (
        <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
          <FiCode size={14} />
        </Btn>
      )}

      {has('color') && <ColorButton editor={editor} />}
      {has('highlight') && <HighlightButton editor={editor} />}

      <Divider />

      {has('bulletList') && (
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bulleted list">
          <FiList size={14} />
        </Btn>
      )}
      {has('orderedList') && (
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
          <span className="text-[11px] font-semibold tabular-nums">1.</span>
        </Btn>
      )}

      {has('textAlign') && (
        <>
          <Divider />
          <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
            <FiAlignLeft size={14} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
            <FiAlignCenter size={14} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
            <FiAlignRight size={14} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
            <FiAlignJustify size={14} />
          </Btn>
        </>
      )}

      {has('link') && (
        <>
          <Divider />
          <Btn onClick={promptLink} active={editor.isActive('link')} title="Insert / edit link">
            <FiLink size={14} />
          </Btn>
        </>
      )}

      {/* Image upload — only when the parent provides a handler. The
          handler receives the editor instance and is expected to call
          `editor.chain().focus().setImage({ src }).run()` after upload. */}
      {has('image') && typeof onImageUpload === 'function' && (
        <Btn onClick={() => onImageUpload(editor)} title="Upload image">
          <FiImage size={14} />
        </Btn>
      )}

      <Divider />

      <Btn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <FiRotateCcw size={14} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Shift+Z)"
      >
        <FiRotateCw size={14} />
      </Btn>
    </div>
  );
}

/* -------------------------- Toolbar primitives -------------------------- */

function Btn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors ${
        active
          ? 'bg-[#007074] text-white'
          : 'text-slate-700 hover:bg-white hover:text-[#007074]'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-slate-200 mx-0.5" aria-hidden="true" />;
}

function Select({ value, onChange, title, icon, children }) {
  return (
    <label className="relative inline-flex items-center" title={title}>
      {icon && <span className="absolute left-2 text-slate-500 pointer-events-none">{icon}</span>}
      <select
        value={value}
        onChange={onChange}
        className={`h-8 ${icon ? 'pl-7' : 'pl-2'} pr-7 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:border-[#007074] focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074] appearance-none`}
      >
        {children}
      </select>
      <FiChevronDown className="absolute right-1.5 text-slate-400 pointer-events-none" size={12} />
    </label>
  );
}

/* -------------------------- Color / Highlight popovers -------------------------- */

const COLORS = [
  '#222222', '#4b5563', '#9ca3af', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#007074',
];

function ColorButton({ editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);
  const current = editor.getAttributes('textStyle')?.color || '';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Text color"
        className={`w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-700 hover:bg-white hover:text-[#007074]`}
      >
        <span className="flex flex-col items-center leading-none">
          <span className="text-[11px] font-semibold">A</span>
          <span className="block w-3 h-0.5 mt-0.5 rounded" style={{ backgroundColor: current || '#222' }} />
        </span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg p-2 grid grid-cols-6 gap-1 w-48">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { editor.chain().focus().setColor(c).run(); setOpen(false); }}
              className="w-6 h-6 rounded border border-slate-200"
              style={{ backgroundColor: c }}
              aria-label={`Set color ${c}`}
            />
          ))}
          <button
            type="button"
            onClick={() => { editor.chain().focus().unsetColor().run(); setOpen(false); }}
            className="col-span-6 mt-1 text-[11px] text-slate-500 hover:text-slate-800 py-1"
          >
            Clear color
          </button>
        </div>
      )}
    </div>
  );
}

function HighlightButton({ editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Highlight"
        className="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-700 hover:bg-white hover:text-[#007074]"
      >
        <span className="text-[11px] font-semibold bg-yellow-200 px-1 rounded-sm">H</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg p-2 grid grid-cols-6 gap-1 w-48">
          {['#fef3c7', '#fde68a', '#fecaca', '#bbf7d0', '#bfdbfe', '#e9d5ff'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); setOpen(false); }}
              className="w-6 h-6 rounded border border-slate-200"
              style={{ backgroundColor: c }}
              aria-label={`Highlight ${c}`}
            />
          ))}
          <button
            type="button"
            onClick={() => { editor.chain().focus().unsetHighlight().run(); setOpen(false); }}
            className="col-span-6 mt-1 text-[11px] text-slate-500 hover:text-slate-800 py-1"
          >
            Clear highlight
          </button>
        </div>
      )}
    </div>
  );
}
