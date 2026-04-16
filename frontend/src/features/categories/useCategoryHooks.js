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
            qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
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
            qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
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
            qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
            toast.success('Category deleted');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        },
    });
};
