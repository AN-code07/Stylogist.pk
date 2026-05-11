import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const CATEGORIES_KEY = ['categories'];

export const useCategories = (params = {}) => {
    return useQuery({
        queryKey: [...CATEGORIES_KEY, params],
        queryFn: async () => {
            const { data } = await axiosClient.get('/categories', { params });
            return data.data;
        },
    });
};

// Resolve a single category by its slug. Used by /category/:slug to
// translate the URL anchor into the category record (name, image, meta).
// We grab the full list (with the existing 5-min cache) and pick the slug
// rather than spinning a new endpoint — the backend doesn't expose a
// /categories/slug/:slug route and the list is small enough to scan.
export const useCategoryBySlug = (slug) => {
    return useQuery({
        queryKey: [...CATEGORIES_KEY, 'slug', slug],
        queryFn: async () => {
            const { data } = await axiosClient.get('/categories', { params: { active: 'all' } });
            const list = data.data || [];
            return list.find((c) => c.slug === slug) || null;
        },
        enabled: !!slug,
        staleTime: 5 * 60 * 1000,
    });
};

export const useCategoryTree = () => {
    return useQuery({
        queryKey: [...CATEGORIES_KEY, 'tree'],
        queryFn: async () => {
            const { data } = await axiosClient.get('/categories/tree');
            return data.data;
        },
    });
};

export const useCreateCategory = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await axiosClient.post('/categories', payload);
            return data.data;
        },
        onSuccess: () => {
            // `refetchType: 'all'` so the category tree, slug lookup,
            // and any active list re-pull on next render — admin CRUD
            // is reflected without a manual refresh.
            qc.invalidateQueries({ queryKey: CATEGORIES_KEY, refetchType: 'all' });
            toast.success('Category created');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create category');
        },
    });
};

export const useUpdateCategory = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }) => {
            const { data } = await axiosClient.patch(`/categories/${id}`, payload);
            return data.data;
        },
        onSuccess: () => {
            // `refetchType: 'all'` so the category tree, slug lookup,
            // and any active list re-pull on next render — admin CRUD
            // is reflected without a manual refresh.
            qc.invalidateQueries({ queryKey: CATEGORIES_KEY, refetchType: 'all' });
            toast.success('Category updated');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update category');
        },
    });
};

export const useDeleteCategory = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            await axiosClient.delete(`/categories/${id}`);
            return id;
        },
        onSuccess: () => {
            // `refetchType: 'all'` so the category tree, slug lookup,
            // and any active list re-pull on next render — admin CRUD
            // is reflected without a manual refresh.
            qc.invalidateQueries({ queryKey: CATEGORIES_KEY, refetchType: 'all' });
            toast.success('Category deleted');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        },
    });
};
