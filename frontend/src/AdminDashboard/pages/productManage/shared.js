import { Quill } from 'react-quill-new';

// Extra font families exposed on the Quill picker. Must be kept in sync with
// the `.ql-font-*` selectors in index.css.
export const FONT_WHITELIST = [
  'sans-serif', 'serif', 'monospace', 'inter', 'poppins', 'playfair', 'roboto', 'lora',
];

const Font = Quill.import('formats/font');
Font.whitelist = FONT_WHITELIST;
Quill.register(Font, true);

export const QUILL_FORMATS = [
  'header', 'font', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet', 'indent', 'align',
  'link', 'image', 'video',
];

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
  color: '',
  material: '',
  originalPrice: '',
  salePrice: '',
  stock: '',
});

export const emptyForm = {
  name: '',
  slug: '',
  description: '',
  shortDescription: '',
  metaTitle: '',
  metaDescription: '',
  category: '',
  categories: [],
  brand: '',
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
