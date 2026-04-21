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

export const useProduct = (slug) => {
    return useQuery({
        queryKey: [...PRODUCTS_KEY, 'slug', slug],
        queryFn: async () => {
            const { data } = await axiosClient.get(`/products/${slug}`);
            return data.data;
        },
        enabled: !!slug,
        staleTime: PRODUCT_DETAIL_STALE_MS,
        gcTime: PRODUCT_DETAIL_GC_MS,
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
