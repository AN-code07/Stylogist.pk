import { useEffect, useMemo, useState } from 'react';
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
import { useUploadImage, useUploadImages } from '../../../features/uploads/useUploadHooks';
import { emptyForm, emptyVariant, slugify } from './shared';

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

  const { data: productsResp, isLoading: loadingProducts } = useProducts({ status: statusFilter, limit: 100 });
  const { data: categories = [] } = useCategories({ active: 'all' });
  const { data: brands = [] } = useBrands();
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

  // Hydrate the form whenever the edit-query resolves.
  useEffect(() => {
    if (!editingId || !editingProductData) return;
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
      category: primaryCategory,
      categories: [...new Set(existingCategories)],
      brand: product.brand?._id || product.brand || '',
      status: product.status || 'draft',
      isFeatured: !!product.isFeatured,
      isTrending: !!product.isTrending,
      isDeal: !!product.isDeal,
      variants: variants.length
        ? variants.map((v) => ({
          sku: v.sku || '',
          size: v.size || '',
          color: v.color || '',
          material: v.material || '',
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
  }, [editingId, editingProductData]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setView('list');
  };

  const startEdit = (product) => {
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

    const variants = form.variants.map((v) => ({
      sku: v.sku.trim() || undefined,
      size: v.size.trim() || undefined,
      color: v.color.trim() || undefined,
      material: v.material.trim() || undefined,
      originalPrice: Number(v.originalPrice),
      salePrice: Number(v.salePrice),
      stock: Number(v.stock),
    }));

    for (const [i, v] of variants.entries()) {
      if (Number.isNaN(v.originalPrice) || Number.isNaN(v.salePrice) || Number.isNaN(v.stock)) {
        return toast.error(`Variant ${i + 1}: numeric fields required`);
      }
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim() || undefined,
      metaTitle: form.metaTitle.trim() || undefined,
      metaDescription: form.metaDescription.trim() || undefined,
      category: form.category || form.categories[0],
      categories: form.categories?.length ? form.categories : undefined,
      brand: form.brand || undefined,
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
