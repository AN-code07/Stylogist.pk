import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const BRANDS_KEY = ['brands'];

export const useBrands = (params = {}) => {
    return useQuery({
        queryKey: [...BRANDS_KEY, params],
        queryFn: async () => {
            const { data } = await axiosClient.get('/brands', { params });
            return data.data;
        },
    });
};

export const useCreateBrand = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await axiosClient.post('/brands', payload);
            return data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: BRANDS_KEY });
            toast.success('Brand created');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create brand');
        },
    });
};

export const useUpdateBrand = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }) => {
            const { data } = await axiosClient.patch(`/brands/${id}`, payload);
            return data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: BRANDS_KEY });
            toast.success('Brand updated');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update brand');
        },
    });
};

export const useDeleteBrand = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            await axiosClient.delete(`/brands/${id}`);
            return id;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: BRANDS_KEY });
            toast.success('Brand deleted');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete brand');
        },
    });
};
