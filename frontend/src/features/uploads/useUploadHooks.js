import { useMutation } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

export const useUploadImage = () => {
    return useMutation({
        mutationFn: async (file) => {
            const form = new FormData();
            form.append('file', file);
            const { data } = await axiosClient.post('/uploads/image', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data.data;
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Upload failed');
        },
    });
};

export const useUploadImages = () => {
    return useMutation({
        mutationFn: async (files) => {
            const form = new FormData();
            Array.from(files).forEach((f) => form.append('files', f));
            const { data } = await axiosClient.post('/uploads/images', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data.data;
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Upload failed');
        },
    });
};
