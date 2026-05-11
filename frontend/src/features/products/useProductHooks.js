import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const PRODUCTS_KEY = ['products'];

// Tunables: product listings are read-heavy and rarely change within a
// browsing session, so we cache aggressively and keep the previous page
// visible while the next page loads — pagination feels instant and
// background refetches replace the data without a flicker.
const PRODUCT_LIST_STALE_MS = 2 * 60 * 1000;  // 2 minutes
const PRODUCT_LIST_GC_MS = 10 * 60 * 1000;    // 10 minutes
const PRODUCT_DETAIL_STALE_MS = 5 * 60 * 1000; // 5 minutes
const PRODUCT_DETAIL_GC_MS = 15 * 60 * 1000;   // 15 minutes

export const useProducts = (params = {}) => {
    return useQuery({
        queryKey: [...PRODUCTS_KEY, params],
        queryFn: async () => {
            const { data } = await axiosClient.get('/products', { params });
            return { items: data.data, pagination: data.pagination };
        },
        placeholderData: keepPreviousData,
        staleTime: PRODUCT_LIST_STALE_MS,
        gcTime: PRODUCT_LIST_GC_MS,
    });
};

// Body-driven product search. Pairs with the new `POST /products/search`
// endpoint so filter state never enters the URL. The query key includes
// the payload so React Query treats different filter combinations as
// different queries (correct cache hits without URL params).
export const useProductsSearch = (payload = {}, options = {}) => {
    return useQuery({
        queryKey: [...PRODUCTS_KEY, 'search', payload],
        queryFn: async () => {
            const { data } = await axiosClient.post('/products/search', payload);
            return {
                items: data.data,
                pagination: data.pagination,
                scope: data.scope,
            };
        },
        placeholderData: keepPreviousData,
        staleTime: PRODUCT_LIST_STALE_MS,
        gcTime: PRODUCT_LIST_GC_MS,
        ...options,
    });
};

// Shared query options factory used by both `useProduct` and the React
// Router loader for /product/:slug. Letting the loader call
// `queryClient.prefetchQuery(productBySlugQuery(slug))` means by the time
// the component mounts the data is in cache — no skeleton flash, JSON-LD
// emits on first paint.
//
// When the backend responds with `{ status: 'redirect', redirect: '/...' }`
// we surface it via a tagged result so the component can `<Navigate>` to
// the new slug — that path is hit when an admin renames a product and an
// old URL/bookmark is requested.
export const productBySlugQuery = (slug) => ({
    queryKey: [...PRODUCTS_KEY, 'slug', slug],
    queryFn: async () => {
        const { data } = await axiosClient.get(`/products/${slug}`);
        if (data?.status === 'redirect' && data?.redirect) {
            return { __redirect: data.redirect };
        }
        return data.data;
    },
    staleTime: PRODUCT_DETAIL_STALE_MS,
    gcTime: PRODUCT_DETAIL_GC_MS,
});

export const useProduct = (slug) => {
    return useQuery({
        ...productBySlugQuery(slug),
        enabled: !!slug,
    });
};

export const useProductById = (id) => {
    return useQuery({
        queryKey: [...PRODUCTS_KEY, 'id', id],
        queryFn: async () => {
            const { data } = await axiosClient.get(`/products/id/${id}`);
            return data.data;
        },
        enabled: !!id,
        staleTime: PRODUCT_DETAIL_STALE_MS,
        gcTime: PRODUCT_DETAIL_GC_MS,
    });
};

// Invalidates EVERY product-scoped query — lists, detail-by-id,
// detail-by-slug, body-driven search — so any mutation refreshes the
// UI without a manual reload. `refetchType: 'active'` (the default)
// only refetches mounted queries; we also want recently-cached PDP
// queries to re-pull next time the user lands on them, so we ask for
// 'all' which marks inactive queries stale + refetches active ones.
//
// Accepts a list of additional exact keys (e.g. the just-edited
// product's detail key) so the caller can guarantee a fresh fetch the
// instant it needs the new data, not just on next mount.
const bustProductCache = (qc, extraKeys = []) => {
    qc.invalidateQueries({ queryKey: PRODUCTS_KEY, refetchType: 'all' });
    extraKeys.forEach((key) => qc.invalidateQueries({ queryKey: key, refetchType: 'all' }));
};

export const useCreateProduct = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await axiosClient.post('/products', payload);
            return data.data;
        },
        onSuccess: () => {
            bustProductCache(qc);
            toast.success('Product created');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create product');
        },
    });
};

// Auto-save-draft hook. Distinct from `useCreateProduct` because the
// success path is intentionally quieter (toast: "Draft saved" instead
// of "Product created") and there's no validation error surfacing —
// auto-save is best-effort, the regular create flow handles real errors.
export const useCreateDraftProduct = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await axiosClient.post('/products/draft', payload);
            return data.data;
        },
        onSuccess: () => {
            bustProductCache(qc);
        },
    });
};

export const useUpdateProduct = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }) => {
            const { data } = await axiosClient.patch(`/products/${id}`, payload);
            return data.data;
        },
        onSuccess: (updated, variables) => {
            // Also nuke the exact detail-by-id key so the admin editor
            // re-pulls when reopened, and any PDP-by-slug cache that may
            // still hold the pre-edit name/price/etc.
            const slug = updated?.product?.slug;
            bustProductCache(qc, [
                [...PRODUCTS_KEY, 'id', variables.id],
                ...(slug ? [[...PRODUCTS_KEY, 'slug', slug]] : []),
            ]);
            toast.success('Product updated');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update product');
        },
    });
};

export const useDeleteProduct = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            await axiosClient.delete(`/products/${id}`);
            return id;
        },
        onSuccess: (deletedId) => {
            // Drop the exact detail cache entries for this product so a
            // stale PDP visit after delete doesn't render ghost data.
            qc.removeQueries({ queryKey: [...PRODUCTS_KEY, 'id', deletedId] });
            bustProductCache(qc);
            toast.success('Product deleted');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete product');
        },
    });
};
