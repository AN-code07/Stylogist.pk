import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const ADDRESSES_KEY = ['addresses'];

// Accepts an `enabled` flag so callers can skip the fetch for anonymous
// visitors — guest checkout doesn't need the saved-address book and firing
// this as anon would just return 401.
export const useAddresses = ({ enabled = true } = {}) => {
    return useQuery({
        queryKey: ADDRESSES_KEY,
        queryFn: async () => {
            const { data } = await axiosClient.get('/addresses');
            return data.data.addresses || [];
        },
        enabled,
    });
};

export const useAddAddress = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await axiosClient.post('/addresses', payload);
            return data.data.address;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ADDRESSES_KEY });
            toast.success('Address saved');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to save address');
        },
    });
};

export const useUpdateAddress = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }) => {
            const { data } = await axiosClient.patch(`/addresses/${id}`, payload);
            return data.data.address;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ADDRESSES_KEY });
            toast.success('Address updated');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update address');
        },
    });
};

export const useDeleteAddress = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            await axiosClient.delete(`/addresses/${id}`);
            return id;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ADDRESSES_KEY });
            toast.success('Address removed');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to remove address');
        },
    });
};
