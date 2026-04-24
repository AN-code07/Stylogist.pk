import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

// ---------- Stats ----------

export const useOverview = () => {
    return useQuery({
        queryKey: ['admin', 'overview'],
        queryFn: async () => {
            const { data } = await axiosClient.get('/admin/stats/overview');
            return data.data;
        },
        refetchInterval: 60_000, // keep the dashboard reasonably fresh without thrashing
    });
};

export const useAnalytics = (timeframe = '30D') => {
    return useQuery({
        queryKey: ['admin', 'analytics', timeframe],
        queryFn: async () => {
            const { data } = await axiosClient.get('/admin/stats/analytics', { params: { timeframe } });
            return data.data;
        },
    });
};

// ---------- Customers ----------

export const useCustomers = (params = {}) => {
    return useQuery({
        queryKey: ['admin', 'customers', params],
        queryFn: async () => {
            const { data } = await axiosClient.get('/admin/customers', { params });
            return { items: data.data, pagination: data.pagination };
        },
        keepPreviousData: true,
    });
};

export const useCustomerProfile = (id) => {
    return useQuery({
        queryKey: ['admin', 'customer', id],
        queryFn: async () => {
            const { data } = await axiosClient.get(`/admin/customers/${id}`);
            return data.data;
        },
        enabled: !!id,
    });
};

export const useBlockCustomer = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { data } = await axiosClient.patch(`/admin/customers/${id}/block`);
            return data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'customers'] });
            toast.success('Customer blocked');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to block customer');
        },
    });
};

export const useUnblockCustomer = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { data } = await axiosClient.patch(`/admin/customers/${id}/unblock`);
            return data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'customers'] });
            toast.success('Customer unblocked');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to unblock customer');
        },
    });
};

// ---------- Orders ----------

const ORDERS_KEY = ['admin', 'orders'];

export const useAdminOrders = (params = {}) => {
    return useQuery({
        queryKey: [...ORDERS_KEY, params],
        queryFn: async () => {
            const { data } = await axiosClient.get('/admin/orders', { params });
            return { items: data.data, pagination: data.pagination };
        },
        keepPreviousData: true,
    });
};

export const useUpdateOrderStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status, trackingCompany, trackingLink, trackingId }) => {
            const { data } = await axiosClient.patch(`/admin/orders/${id}/status`, { status, trackingCompany, trackingLink, trackingId });
            return data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ORDERS_KEY });
            qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
            toast.success('Order status updated');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update order');
        },
    });
};
