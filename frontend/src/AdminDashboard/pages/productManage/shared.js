// shared.js
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';

export const FONT_WHITELIST = [
  'sans-serif', 'serif', 'monospace', 'inter', 'poppins', 'playfair', 'roboto', 'lora',
];

const STRIPPABLE_INLINE_STYLES = [
  'font-weight', 'font-size', 'font-family', 'color', 'background-color', 'line-height'
];

/**
 * Replaces Quill's CleanClipboard and PASTE_MATCHERS.
 * Pass this to Tiptap's `editorProps.transformPastedHTML`
 */
export const transformStandardPaste = (html) => {
  if (!html) return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');

  // 1. Strip specific inline styles
  doc.querySelectorAll('*').forEach((el) => {
    if (el.style) {
      STRIPPABLE_INLINE_STYLES.forEach((prop) => {
        el.style.removeProperty(prop);
      });
      // Remove empty style attributes
      if (!el.getAttribute('style')) {
        el.removeAttribute('style');
      }
    }
  });

  // 2. Flatten <span> tags that have no remaining attributes
  doc.querySelectorAll('span').forEach((span) => {
    if (!span.attributes || span.attributes.length === 0) {
      span.replaceWith(...span.childNodes);
    }
  });

  return doc.body.innerHTML;
};

/**
 * Replaces SHORT_PASTE_MATCHERS.
 * Strips bold tags completely for the short description editor.
 */
export const transformShortPaste = (html) => {
  const standardHtml = transformStandardPaste(html);
  const doc = new DOMParser().parseFromString(standardHtml, 'text/html');

  // Strip bold/strong semantic tags, leaving just the text
  doc.querySelectorAll('b, strong').forEach((el) => {
    el.replaceWith(...el.childNodes);
  });

  return doc.body.innerHTML;
};

/**
 * Replaces QUILL_FORMATS.
 * Use this array as the `extensions` prop in your standard useEditor() hook.
 */
export const TIPTAP_EXTENSIONS = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4, 5, 6], // Explicitly register header levels
    },
    strike: true,
    bold: true,
    italic: true,
    bulletList: true,
    orderedList: true,
  }),
  Underline,
  TextStyle,
  FontFamily,
  Color,
  Highlight.configure({ multicolor: true }), // For background colors
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Link.configure({ openOnClick: false }),
  Image,
  // Note: Video usually requires a custom extension or @tiptap/extension-youtube depending on your needs.
];

/**
 * Short-description toolbar set. Heading is disabled (one-line blurb), bold
 * stays off by design (the previous Quill bug auto-bolded short descriptions
 * — keeping bold off prevents the same regression). Italic, underline,
 * lists, alignment and links are kept since admins want at least lightweight
 * formatting for shop card teasers.
 */
export const SHORT_TIPTAP_EXTENSIONS = [
  StarterKit.configure({
    heading: false,
    bold: false,
    strike: false,
    code: false,
    codeBlock: false,
    blockquote: false,
    horizontalRule: false,
  }),
  Underline,
  TextAlign.configure({ types: ['paragraph'] }),
  Link.configure({ openOnClick: false }),
];

// --- The rest of your pure functions remain entirely unchanged ---

export const slugify = (value) =>
  (value || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['"’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const emptyVariant = () => ({
  sku: '',
  size: '',
  packSize: '',
  color: '',
  ingredients: '',
  originalPrice: '',
  salePrice: '',
  stock: '',
});

export const emptyItemDetails = () => ({
  itemForm: '',
  containerType: '',
  ageRange: '',
  dosageForm: '',
});

export const emptyForm = {
  name: '',
  slug: '',
  description: '',
  shortDescription: '',
  metaTitle: '',
  metaDescription: '',
  barcode: '',
  // Identifier type for `barcode`. Drives the input mask + the schema.org
  // property the storefront emits (gtin12 / gtin13 / isbn).
  gtinType: '',
  benefits: [],
  uses: [],
  // Single "How to use" block — short rich-text body + an optional image
  // URL. Stored as `{ text, image }`. Distinct from `uses` (which is a
  // bullet list).
  howToUse: { text: '', image: '' },
  // Per-product FAQ. Stored as [{ question, answer }] in form state and
  // POSTed verbatim — service layer drops empty rows.
  faq: [],
  itemDetails: emptyItemDetails(),
  category: '',
  categories: [],
  brand: '',
  // Many-to-many ingredient tags. Distinct from `Variant.ingredients`
  // (free-text per variant). Ids resolve to Ingredient docs server-side.
  ingredients: [],
  status: 'draft',
  isFeatured: false,
  isTrending: false,
  isDeal: false,
  variants: [emptyVariant()],
  thumbnail: null,
  media: [],
};

export const stripHtmlLen = (html) =>
  (html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length;

export const inputCls =
  'w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074] transition-colors';