import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useBlocker, useLocation } from 'react-router-dom';
import {
  useProducts,
  useCreateProduct,
  useCreateDraftProduct,
  useDeleteProduct,
  useUpdateProduct,
  useProductById,
} from '../../../features/products/useProductHooks';
import { useCategories } from '../../../features/categories/useCategoryHooks';
import { useBrands } from '../../../features/brands/useBrandHooks';
import { useIngredients } from '../../../features/ingredients/useIngredientHooks';
import { useUploadImage, useUploadImages } from '../../../features/uploads/useUploadHooks';
import { emptyForm, emptyItemDetails, emptyVariant, slugify } from './shared';

// Coerce whatever the server returns for benefits/uses into the new
// { image, items: string[] } shape. Tolerates:
//   • the new shape (object) — used directly
//   • legacy [{text, image}] arrays — first non-empty image becomes the
//     section banner; texts become the bullet list
//   • legacy plain string[] — banner is empty, strings become bullets
const hydrateSectionBlock = (raw) => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return {
      image: typeof raw.image === 'string' ? raw.image : '',
      items: Array.isArray(raw.items)
        ? raw.items.map((s) => (s || '').toString()).filter((s) => s.trim())
        : [],
    };
  }
  if (Array.isArray(raw)) {
    let firstImage = '';
    const items = [];
    for (const row of raw) {
      if (typeof row === 'string') {
        const t = row.trim();
        if (t) items.push(t);
      } else if (row && typeof row === 'object') {
        const t = (row.text || '').toString().trim();
        if (t) items.push(t);
        if (!firstImage && row.image) firstImage = String(row.image);
      }
    }
    return { image: firstImage, items };
  }
  return { image: '', items: [] };
};

// Trim + drop blank rows on submit; preserve the section banner verbatim
// (already a single Cloudinary URL set by SectionBlockEditor).
const serializeSectionBlock = (block) => {
  const image = typeof block?.image === 'string' ? block.image.trim() : '';
  const items = Array.isArray(block?.items)
    ? block.items.map((s) => (s || '').toString().trim()).filter(Boolean)
    : [];
  return { image, items };
};

// All the controller-level state + handlers for the Product Manage page.
// Keeps the top-level component presentational and lean.
export default function useProductManage() {
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [offcanvas, setOffcanvas] = useState(null);

  // Tracks which product id has already had its server data hydrated into the
  // form. Prevents the previous bug where a background refetch (window focus,
  // mutation invalidation) would silently overwrite the admin's in-progress
  // edits with the original server values.
  const hydratedFor = useRef(null);

  const { data: productsResp, isLoading: loadingProducts } = useProducts({ status: statusFilter, limit: 100 });
  const { data: categories = [] } = useCategories({ active: 'all' });
  const { data: brands = [] } = useBrands();
  // Pull active ingredients for the multi-select. limit:200 covers any
  // reasonable taxonomy without paginating the picker.
  const { data: ingredientsResp } = useIngredients({ active: 'true', limit: 200 });
  const ingredients = ingredientsResp?.items ?? [];
  const { data: editingProductData } = useProductById(editingId);

  const createMut = useCreateProduct();
  const draftMut = useCreateDraftProduct();
  const updateMut = useUpdateProduct();
  const deleteMut = useDeleteProduct();
  const uploadOne = useUploadImage();
  const uploadMany = useUploadImages();

  // Auto-save-as-draft bookkeeping:
  // - `submittedRef` flips true after a successful submit/cancel-with-save
  //   so we don't double-persist the same form on the way out of the view.
  // - `draftSavingRef` guards against re-entrant saves when the user
  //   triggers two nav-aways in quick succession.
  const submittedRef = useRef(false);
  const draftSavingRef = useRef(false);
  const location = useLocation();

  const products = productsResp?.items ?? [];

  const categoryTree = useMemo(() => {
    const tops = categories.filter((c) => c.level === 0);
    return tops.map((top) => ({
      ...top,
      children: categories.filter((c) => String(c.parent) === String(top._id)),
    }));
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q)
    );
  }, [products, search]);

  // Hydrate the form once per edit session. The ref guard ensures background
  // refetches never overwrite the admin's in-progress edits.
  useEffect(() => {
    if (!editingId) return;
    if (hydratedFor.current === editingId) return;
    if (!editingProductData?.product) return;

    const { product, variants = [], media = [] } = editingProductData;
    const thumbDoc = media.find((m) => m.isThumbnail) || null;
    const gallery = media.filter((m) => !m.isThumbnail);
    const primaryCategory = product.category?._id || product.category || '';
    const existingCategories = Array.isArray(product.categories) && product.categories.length
      ? product.categories.map((c) => c?._id || c).filter(Boolean).map(String)
      : [primaryCategory, product.subCategory?._id || product.subCategory].filter(Boolean).map(String);

    setForm({
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      barcode: product.barcode || '',
      gtinType: product.gtinType || '',
      // Benefits + uses are now { image, items: string[] }. Hydration also
      // accepts the legacy [{text, image}] and plain string[] shapes so
      // existing catalogue rows load cleanly — the first non-empty per-row
      // image is promoted to the section banner on read.
      benefits: hydrateSectionBlock(product.benefits),
      uses: hydrateSectionBlock(product.uses),
      // "How to use" + ingredient highlight blocks — both shaped {text, image}.
      howToUse: {
        text: product.howToUse?.text || '',
        image: product.howToUse?.image || '',
      },
      ingredientHighlight: {
        text: product.ingredientHighlight?.text || '',
        image: product.ingredientHighlight?.image || '',
      },
      // Why-love-it is now a title-only list. Legacy rows with icon/body
      // are flattened to their title.
      whyLoveIt: Array.isArray(product.whyLoveIt)
        ? product.whyLoveIt
            .map((w) => ({ title: w?.title || '' }))
            .filter((w) => w.title)
        : [],
      precautions: Array.isArray(product.precautions)
        ? product.precautions.filter((s) => typeof s === 'string')
        : [],
      storage: product.storage || '',
      taxPercent: Number.isFinite(product.taxPercent) ? product.taxPercent : 0,
      faq: Array.isArray(product.faq)
        ? product.faq.map((q) => ({ question: q?.question || '', answer: q?.answer || '' }))
        : [],
      itemDetails: {
        ...emptyItemDetails(),
        ...(product.itemDetails || {}),
      },
      category: primaryCategory,
      categories: [...new Set(existingCategories)],
      brand: product.brand?._id || product.brand || '',
      manufacturer: product.manufacturer || '',
      ingredients: Array.isArray(product.ingredients)
        ? product.ingredients.map((i) => i?._id || i).filter(Boolean).map(String)
        : [],
      status: product.status || 'draft',
      isFeatured: !!product.isFeatured,
      isTrending: !!product.isTrending,
      isDeal: !!product.isDeal,
      variants: variants.length
        ? variants.map((v) => ({
          sku: v.sku || '',
          size: v.size || '',
          packSize: v.packSize || '',
          color: v.color || '',
          // Variant strength label. Brand-new variants ship with `potency`;
          // legacy variants persisted as `ingredients`/`material` text get
          // surfaced into the same field so admins don't lose data when
          // they open an old product for editing. The next save migrates
          // the row away from the old keys.
          potency: v.potency || v.ingredients || v.material || '',
          originalPrice: v.originalPrice ?? '',
          salePrice: v.salePrice ?? '',
          stock: v.stock ?? '',
        }))
        : [emptyVariant()],
      thumbnail: thumbDoc
        ? {
          url: thumbDoc.url,
          filename: thumbDoc.filename,
          slug: thumbDoc.slug,
          metaTitle: thumbDoc.metaTitle || '',
          metaDescription: thumbDoc.metaDescription || '',
          alt: thumbDoc.alt || '',
        }
        : null,
      media: gallery.map((m) => ({
        url: m.url,
        filename: m.filename,
        slug: m.slug,
        metaTitle: m.metaTitle || '',
        metaDescription: m.metaDescription || '',
        alt: m.alt || '',
      })),
    });

    hydratedFor.current = editingId;
  }, [editingId, editingProductData]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setView('list');
    hydratedFor.current = null;
    // Clear the submitted flag so the NEXT form open starts fresh —
    // otherwise the auto-save wouldn't fire on a subsequent abandonment.
    submittedRef.current = false;
  };

  const startEdit = (product) => {
    // Reset hydration marker so the next id gets a fresh hydration even if the
    // cache still has the previous product's data.
    hydratedFor.current = null;
    setForm(emptyForm);
    setEditingId(product._id);
    setView('form');
    // Edits don't need auto-save (the source row already exists).
    // Mark as submitted so the abandonment heuristic stays quiet.
    submittedRef.current = true;
  };

  // Opens a fresh "Add product" form. Resets the submitted flag so the
  // upcoming abandonment will be saved as a draft.
  const startCreate = () => {
    hydratedFor.current = null;
    setForm(emptyForm);
    setEditingId(null);
    setView('form');
    submittedRef.current = false;
  };

  // True when the admin is creating a NEW product (not editing) and has
  // typed enough that losing the work matters. A two-character name is a
  // low enough bar that "Whey" or "Ω-3" both qualify, but high enough
  // that an accidental keypress doesn't spawn empty drafts.
  const isDraftWorthSaving = () =>
    editingId === null &&
    view === 'form' &&
    !submittedRef.current &&
    (form.name || '').trim().length >= 2;

  // Build the payload sent to /products/draft. Mirrors handleSubmit's
  // payload shape but every field is optional and we don't enforce
  // numbers — the backend coerces. Defensive .trim()s keep the row clean.
  const buildDraftPayload = useCallback(() => {
    const trimmedVariants = (form.variants || [])
      .map((v) => ({
        sku: (v.sku || '').trim() || undefined,
        size: (v.size || '').trim() || undefined,
        packSize: (v.packSize || '').trim() || undefined,
        color: (v.color || '').trim() || undefined,
        potency: (v.potency || '').trim() || undefined,
        originalPrice: v.originalPrice === '' ? undefined : Number(v.originalPrice),
        salePrice: v.salePrice === '' ? undefined : Number(v.salePrice),
        stock: v.stock === '' ? undefined : Number(v.stock),
      }))
      .filter((v) => v.sku || v.size || v.packSize || v.color || v.potency || Number.isFinite(v.salePrice));

    return {
      name: form.name.trim(),
      slug: form.slug?.trim() || undefined,
      description: form.description?.trim() || undefined,
      shortDescription: form.shortDescription?.trim() || undefined,
      metaTitle: form.metaTitle?.trim() || undefined,
      metaDescription: form.metaDescription?.trim() || undefined,
      barcode: form.barcode?.trim() || undefined,
      gtinType: form.barcode?.trim() ? (form.gtinType || undefined) : undefined,
      category: form.category || form.categories?.[0] || undefined,
      categories: form.categories?.length ? form.categories : undefined,
      brand: form.brand || undefined,
      manufacturer: (form.manufacturer || '').trim() || undefined,
      ingredients: form.ingredients?.length ? form.ingredients : undefined,
      // Benefits + uses are now { image, items: string[] } — one optional
      // section banner plus a flat bullet list. The serializer trims +
      // drops blank bullets but keeps an empty section so server-side
      // replace clears stale values.
      benefits: serializeSectionBlock(form.benefits),
      uses: serializeSectionBlock(form.uses),
      precautions: (form.precautions || []).filter((s) => s && s.trim()),
      storage: (form.storage || '').trim() || undefined,
      taxPercent: Number.isFinite(Number(form.taxPercent)) ? Number(form.taxPercent) : 0,
      whyLoveIt: (form.whyLoveIt || [])
        .map((w) => ({ title: (w?.title || '').trim() }))
        .filter((w) => w.title),
      howToUse: {
        text: (form.howToUse?.text || '').trim(),
        image: (form.howToUse?.image || '').trim(),
      },
      ingredientHighlight: {
        text: (form.ingredientHighlight?.text || '').trim(),
        image: (form.ingredientHighlight?.image || '').trim(),
      },
      faq: (form.faq || []).filter((q) => q?.question?.trim() && q?.answer?.trim()),
      isFeatured: !!form.isFeatured,
      isTrending: !!form.isTrending,
      isDeal: !!form.isDeal,
      variants: trimmedVariants,
      thumbnail: form.thumbnail || undefined,
      media: form.media?.length ? form.media : undefined,
    };
  }, [form]);

  // Persists the current form as a draft. Returns a promise so callers
  // can await it before allowing navigation to proceed.
  const autoSaveDraft = useCallback(async () => {
    if (!isDraftWorthSaving() || draftSavingRef.current) return null;
    draftSavingRef.current = true;
    try {
      const saved = await draftMut.mutateAsync(buildDraftPayload());
      submittedRef.current = true;
      toast.success('Draft saved — find it under Products (status: draft)', {
        duration: 4000,
      });
      return saved;
    } catch {
      // Auto-save is best-effort. If it fails (offline, validation
      // gotcha), we don't block the user's navigation.
      return null;
    } finally {
      draftSavingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildDraftPayload, draftMut, editingId, view, form.name]);

  // Cancel button — if the user has typed something we persist it as a
  // draft before discarding the form. Otherwise we silently reset.
  const handleCancel = useCallback(async () => {
    if (isDraftWorthSaving()) {
      await autoSaveDraft();
    }
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSaveDraft, editingId, view, form.name]);

  // Intercepts in-app navigation away from the form: sidebar links,
  // breadcrumb clicks, browser back/forward inside the SPA. Only blocks
  // when we have a dirty NEW-product form so editing existing products
  // (whose data already exists in the catalogue) isn't disturbed.
  // Requires React Router's data-router mode (createBrowserRouter), which
  // this app uses.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!isDraftWorthSaving()) return false;
    // Same-URL renders (e.g. query-string updates) aren't real navigation.
    return currentLocation.pathname !== nextLocation.pathname;
  });

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    // Save in the background, then proceed regardless of save outcome.
    // We don't want to trap the admin behind a network failure.
    let cancelled = false;
    (async () => {
      try {
        await autoSaveDraft();
      } finally {
        if (!cancelled) blocker.proceed();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blocker, autoSaveDraft]);

  // Tab close / refresh / external navigation. We can't `await` here
  // because the page is going away — `fetch` with `keepalive: true`
  // lets the browser dispatch the POST after the document unloads.
  // The same payload structure is reused so the server-side handler
  // doesn't need a special branch.
  useEffect(() => {
    if (view !== 'form' || editingId !== null) return;

    const onBeforeUnload = (e) => {
      if (!isDraftWorthSaving()) return;
      try {
        const payload = JSON.stringify(buildDraftPayload());
        const apiBase = import.meta.env.VITE_API_URL || '';
        fetch(`${apiBase.replace(/\/$/, '')}/products/draft`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        });
      } catch {
        // ignore — best-effort
      }
      // Best UX: don't trigger the browser's confirm dialog. We've
      // already shipped the save, the user can leave freely.
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, editingId, form.name, buildDraftPayload]);

  const handleGenerateSlug = () => {
    if (!form.name.trim()) {
      toast.error('Enter a product name first');
      return;
    }
    setForm((f) => ({ ...f, slug: slugify(form.name) }));
    toast.success('Slug generated');
  };

  const updateVariant = (idx, patch) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)),
    }));
  };

  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, emptyVariant()] }));

  const removeVariant = (idx) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.length > 1 ? f.variants.filter((_, i) => i !== idx) : f.variants,
    }));
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const productSlug = form.slug || slugify(form.name) || 'product';
    try {
      const res = await uploadOne.mutateAsync({
        file,
        productSlug,
        role: 'thumbnail',
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        alt: form.metaTitle || form.name,
      });
      setForm((f) => ({
        ...f,
        thumbnail: {
          url: res.url,
          filename: res.filename,
          slug: res.slug,
          metaTitle: res.metaTitle || f.metaTitle,
          metaDescription: res.metaDescription || f.metaDescription,
          alt: res.alt || f.metaTitle || f.name,
        },
      }));
      toast.success('Thumbnail uploaded');
    } catch { /* hook toast */ }
    e.target.value = '';
  };

  const removeThumbnail = () => setForm((f) => ({ ...f, thumbnail: null }));

  const handleMediaUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    const productSlug = form.slug || slugify(form.name) || 'product';
    const startIndex = (form.media?.length || 0) + 1;
    try {
      const uploaded = await uploadMany.mutateAsync({
        files,
        productSlug,
        startIndex,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
      });
      setForm((f) => ({
        ...f,
        media: [
          ...f.media,
          ...uploaded.map((u) => ({
            url: u.url,
            filename: u.filename,
            slug: u.slug,
            metaTitle: u.metaTitle || f.metaTitle,
            metaDescription: u.metaDescription || f.metaDescription,
            alt: u.alt || f.metaTitle || f.name,
          })),
        ],
      }));
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded`);
    } catch { /* hook toast */ }
    e.target.value = '';
  };

  const removeMedia = (url) => {
    setForm((f) => ({ ...f, media: f.media.filter((m) => m.url !== url) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return toast.error('Name is required');
    const plainDesc = form.description.replace(/<[^>]*>/g, '').trim();
    if (!plainDesc || plainDesc.length < 5) return toast.error('Description must be at least 5 characters');
    if (!form.category && !(form.categories?.length)) return toast.error('Select at least one category');

    // GTIN identifier is optional, but when supplied it must match the
    // chosen type's format. Mirrors the backend cross-field refine so the
    // user gets a friendly error before the network round-trip.
    const code = (form.barcode || '').trim();
    const type = form.gtinType || '';
    if (code) {
      if (!type) return toast.error('Select an identifier type (UPC / EAN / ISBN)');
      const re =
        type === 'upc' ? /^\d{12}$/
          : type === 'ean' ? /^\d{13}$/
            : type === 'isbn' ? /^\d{9}[\dXx]$/
              : null;
      if (!re || !re.test(code)) {
        return toast.error(
          type === 'upc' ? 'UPC must be exactly 12 digits'
            : type === 'ean' ? 'EAN must be exactly 13 digits'
              : 'ISBN must be 10 characters: 9 digits + check digit (0–9 or X)',
        );
      }
    }

    const variants = form.variants.map((v) => {
      // Stock falls back to 50 when blank or invalid — matches backend default.
      const stockRaw = String(v.stock ?? '').trim();
      const stockNumber = Number(stockRaw);
      const stock = stockRaw === '' || !Number.isFinite(stockNumber) || stockNumber < 0 ? 50 : stockNumber;
      return {
        sku: (v.sku || '').trim() || undefined,
        size: (v.size || '').trim() || undefined,
        packSize: (v.packSize || '').trim() || undefined,
        color: (v.color || '').trim() || undefined,
        // Persist as `potency`. The variant-level `ingredients` string has
        // been retired; the structured Ingredient[] taxonomy at the product
        // level is the new source of truth for filtering/search.
        potency: (v.potency || '').trim() || undefined,
        originalPrice: Number(v.originalPrice),
        salePrice: Number(v.salePrice),
        stock,
      };
    });

    for (const [i, v] of variants.entries()) {
      if (Number.isNaN(v.originalPrice) || Number.isNaN(v.salePrice)) {
        return toast.error(`Variant ${i + 1}: original price and sale price are required`);
      }
    }

    // Benefits + uses serialise as { image, items: string[] }. The
    // serializer drops blank bullets and trims the section banner.
    const benefits = serializeSectionBlock(form.benefits);
    const uses = serializeSectionBlock(form.uses);

    // How-to-use + ingredient highlight blocks — rich-text + single image.
    // Empty text+image means "hide the section"; we still emit them so the
    // server-side replace clears stale values.
    const howToUse = {
      text: (form.howToUse?.text || '').trim(),
      image: (form.howToUse?.image || '').trim(),
    };
    const ingredientHighlight = {
      text: (form.ingredientHighlight?.text || '').trim(),
      image: (form.ingredientHighlight?.image || '').trim(),
    };

    // Same defensiveness for FAQ — both fields are required server-side,
    // so half-filled rows are dropped before submit.
    const faq = (form.faq || [])
      .map((q) => ({
        question: (q?.question || '').trim(),
        answer: (q?.answer || '').trim(),
      }))
      .filter((q) => q.question && q.answer);

    const itemDetails = Object.fromEntries(
      Object.entries(form.itemDetails || {}).map(([k, v]) => [k, (v || '').trim()])
    );

    // "Why customers love it" — title-only list. The previous icon + body
    // fields were retired; the server normalizer strips any legacy keys.
    const whyLoveIt = (form.whyLoveIt || [])
      .map((w) => ({ title: (w?.title || '').trim() }))
      .filter((w) => w.title);

    // Precautions — bullet list. Trim + drop blanks before submit.
    const precautions = (form.precautions || [])
      .map((s) => (s || '').toString().trim())
      .filter(Boolean);

    const storage = (form.storage || '').trim();

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim() || undefined,
      metaTitle: form.metaTitle.trim() || undefined,
      metaDescription: form.metaDescription.trim() || undefined,
      barcode: (form.barcode || '').trim() || undefined,
      // Only emit gtinType when there's an actual code; backend strips
      // orphan types but we keep the wire payload tidy.
      gtinType: (form.barcode || '').trim() ? (form.gtinType || undefined) : undefined,
      benefits,
      uses,
      howToUse,
      ingredientHighlight,
      whyLoveIt,
      precautions,
      storage: storage || undefined,
      // Tax percent. 0 is a meaningful value (tax-inclusive / no tax) so
      // we always send it rather than omitting on 0.
      taxPercent: Number.isFinite(Number(form.taxPercent)) ? Number(form.taxPercent) : 0,
      faq,
      itemDetails,
      category: form.category || form.categories[0],
      categories: form.categories?.length ? form.categories : undefined,
      brand: form.brand || undefined,
      manufacturer: (form.manufacturer || '').trim() || undefined,
      ingredients: form.ingredients?.length ? form.ingredients : undefined,
      status: form.status,
      isFeatured: form.isFeatured,
      isTrending: !!form.isTrending,
      isDeal: !!form.isDeal,
      variants,
      thumbnail: form.thumbnail
        ? {
          url: form.thumbnail.url,
          filename: form.thumbnail.filename,
          slug: form.thumbnail.slug,
          metaTitle: form.thumbnail.metaTitle,
          metaDescription: form.thumbnail.metaDescription,
          alt: form.thumbnail.alt,
          isThumbnail: true,
          position: 0,
        }
        : undefined,
      media: form.media.length
        ? form.media.map((m, idx) => ({
          url: m.url,
          filename: m.filename,
          slug: m.slug,
          metaTitle: m.metaTitle,
          metaDescription: m.metaDescription,
          alt: m.alt,
          position: idx + 1,
        }))
        : [],
    };

    try {
      if (editingId) {
        await updateMut.mutateAsync({ id: editingId, payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      // Mark the form as cleanly submitted BEFORE resetForm so the
      // router blocker (which fires synchronously on the view change)
      // doesn't double-persist the same data as a draft.
      submittedRef.current = true;
      resetForm();
    } catch { /* hook toast */ }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget._id);
      setDeleteTarget(null);
    } catch { /* hook toast */ }
  };

  return {
    view, setView,
    editingId,
    form, setForm,
    deleteTarget, setDeleteTarget,
    search, setSearch,
    statusFilter, setStatusFilter,
    offcanvas, setOffcanvas,

    categories,
    categoryTree,
    brands,
    ingredients,
    products: filteredProducts,
    loadingProducts,

    createMut, updateMut, deleteMut, draftMut,
    uploadOne, uploadMany,

    resetForm,
    startCreate,
    startEdit,
    handleGenerateSlug,
    updateVariant,
    addVariant,
    removeVariant,
    handleThumbnailUpload,
    removeThumbnail,
    handleMediaUpload,
    removeMedia,
    handleSubmit,
    handleDelete,
    handleCancel,
    autoSaveDraft,
  };
}
