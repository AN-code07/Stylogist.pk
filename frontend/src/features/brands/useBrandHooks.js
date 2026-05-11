import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const BRANDS_KEY = ['brands'];

// Resolve a brand by slug for /brand/:slug. Reuses the cached brand list
// instead of spinning a dedicated endpoint — small list, cheap scan.
export const useBrandBySlug = (slug) => {
    return useQuery({
        queryKey: [...BRANDS_KEY, 'slug', slug],
        queryFn: async () => {
            const { data } = await axiosClient.get('/brands');
            const list = data.data || [];
            return list.find((b) => b.slug === slug) || null;
        },
        enabled: !!slug,
        staleTime: 5 * 60 * 1000,
    });
};

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
            // `refetchType: 'all'` re-pulls inactive lists too, so going
            // back to a previously-mounted brand page after a CRUD shows
            // fresh data without a manual refresh.
            qc.invalidateQueries({ queryKey: BRANDS_KEY, refetchType: 'all' });
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
            // `refetchType: 'all'` re-pulls inactive lists too, so going
            // back to a previously-mounted brand page after a CRUD shows
            // fresh data without a manual refresh.
            qc.invalidateQueries({ queryKey: BRANDS_KEY, refetchType: 'all' });
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
            // `refetchType: 'all'` re-pulls inactive lists too, so going
            // back to a previously-mounted brand page after a CRUD shows
            // fresh data without a manual refresh.
            qc.invalidateQueries({ queryKey: BRANDS_KEY, refetchType: 'all' });
            toast.success('Brand deleted');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete brand');
        },
    });
};
