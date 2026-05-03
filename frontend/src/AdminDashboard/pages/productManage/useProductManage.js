import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  useProducts,
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
  useProductById,
} from '../../../features/products/useProductHooks';
import { useCategories } from '../../../features/categories/useCategoryHooks';
import { useBrands } from '../../../features/brands/useBrandHooks';
import { useIngredients } from '../../../features/ingredients/useIngredientHooks';
import { useUploadImage, useUploadImages } from '../../../features/uploads/useUploadHooks';
import { emptyForm, emptyItemDetails, emptyVariant, slugify } from './shared';

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
  const updateMut = useUpdateProduct();
  const deleteMut = useDeleteProduct();
  const uploadOne = useUploadImage();
  const uploadMany = useUploadImages();

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
      benefits: Array.isArray(product.benefits) ? [...product.benefits] : [],
      uses: Array.isArray(product.uses) ? [...product.uses] : [],
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
          // Read from `ingredients` first, fall back to legacy `material`.
          ingredients: v.ingredients || v.material || '',
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
  };

  const startEdit = (product) => {
    // Reset hydration marker so the next id gets a fresh hydration even if the
    // cache still has the previous product's data.
    hydratedFor.current = null;
    setForm(emptyForm);
    setEditingId(product._id);
    setView('form');
  };

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

    // UPC is optional, but when supplied it must be exactly 12 digits — the
    // backend validator rejects anything else with a 400.
    const upc = (form.barcode || '').trim();
    if (upc && !/^\d{12}$/.test(upc)) {
      return toast.error('UPC must be exactly 12 digits');
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
        ingredients: (v.ingredients || '').trim() || undefined,
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

    // Drop empty bullets so the server-side schema (which requires min(1))
    // doesn't reject the whole array because of trailing blank rows.
    const benefits = (form.benefits || []).map((s) => (s || '').trim()).filter(Boolean);
    const uses = (form.uses || []).map((s) => (s || '').trim()).filter(Boolean);

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

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim() || undefined,
      metaTitle: form.metaTitle.trim() || undefined,
      metaDescription: form.metaDescription.trim() || undefined,
      barcode: (form.barcode || '').trim() || undefined,
      benefits,
      uses,
      faq,
      itemDetails,
      category: form.category || form.categories[0],
      categories: form.categories?.length ? form.categories : undefined,
      brand: form.brand || undefined,
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

    createMut, updateMut, deleteMut,
    uploadOne, uploadMany,

    resetForm,
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
  };
}
