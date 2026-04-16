import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const MY_ORDERS_KEY = ['orders', 'me'];

export const useCreateOrder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await axiosClient.post('/orders', payload);
            return data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: MY_ORDERS_KEY });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to place order');
        },
    });
};

export const useMyOrders = (params = {}) => {
    return useQuery({
        queryKey: [...MY_ORDERS_KEY, params],
        queryFn: async () => {
            const { data } = await axiosClient.get('/orders/me', { params });
            return {
                items: data.data,
                pagination: data.pagination,
                summary: data.summary,
            };
        },
    });
};
