import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const REVIEWS_KEY = ['reviews'];

export const useReviews = (params = {}) => {
    return useQuery({
        queryKey: [...REVIEWS_KEY, params],
        queryFn: async () => {
            const { data } = await axiosClient.get('/reviews', { params });
            return { items: data.data, pagination: data.pagination };
        },
        keepPreviousData: true,
    });
};

export const useUpdateReviewStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }) => {
            const { data } = await axiosClient.patch(`/reviews/${id}/status`, { status });
            return data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: REVIEWS_KEY });
            toast.success('Review updated');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update review');
        },
    });
};

export const useDeleteReview = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            await axiosClient.delete(`/reviews/${id}`);
            return id;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: REVIEWS_KEY });
            toast.success('Review deleted');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete review');
        },
    });
};
