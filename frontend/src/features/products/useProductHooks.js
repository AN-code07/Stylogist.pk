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

export const useCreateProduct = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await axiosClient.post('/products', payload);
            return data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
            toast.success('Product created');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create product');
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
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
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
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
            toast.success('Product deleted');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete product');
        },
    });
};
