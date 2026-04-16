import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const PRODUCTS_KEY = ['products'];

export const useProducts = (params = {}) => {
    return useQuery({
        queryKey: [...PRODUCTS_KEY, params],
        queryFn: async () => {
            const { data } = await axiosClient.get('/products', { params });
            return { items: data.data, pagination: data.pagination };
        },
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
