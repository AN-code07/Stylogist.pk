import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import useAuthStore, { hadSession } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

const ME_KEY = ['user', 'me'];

// Legacy named export kept because existing callers import it as `getLoginUser`.
// Anonymous visitors should NOT see a "session expired" toast — only surface
// the message when we had a real session (localStorage flag set at login) and
// the backend now returns 401. Otherwise fail silently: the user simply isn't
// logged in yet.
export const getLoginUser = () => {
    const setAuth = useAuthStore((state) => state.setAuth);
    const clearAuth = useAuthStore((state) => state.clearAuth);

    return useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            const hadActiveSession = hadSession();
            try {
                const { data } = await axiosClient.get("/users/me");
                const user = data.data?.user || data.user;
                setAuth(user);
                return user;
            } catch (error) {
                clearAuth();
                if (error.response?.status === 401 && hadActiveSession) {
                    toast.error("Session expired. Please log in again.");
                }
                throw error;
            }
        },
        retry: false,
        refetchOnWindowFocus: true,
        // Don't retry-spam /users/me; the ProtectedRoute guard handles redirect.
        staleTime: 5 * 60 * 1000,
    });
};

// Modern hook — consumes /users/me and keeps the zustand store in sync.
export const useMe = () => {
    const setAuth = useAuthStore((s) => s.setAuth);

    return useQuery({
        queryKey: ME_KEY,
        queryFn: async () => {
            const { data } = await axiosClient.get('/users/me');
            const user = data.data?.user || data.user;
            setAuth(user);
            return user;
        },
        retry: false,
    });
};

export const useUpdateProfile = () => {
    const qc = useQueryClient();
    const setAuth = useAuthStore((s) => s.setAuth);

    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await axiosClient.patch('/users/me', payload);
            return data.data?.user || data.user;
        },
        onSuccess: (user) => {
            setAuth(user);
            qc.setQueryData(ME_KEY, user);
            toast.success('Profile updated');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        },
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: async ({ currentPassword, newPassword }) => {
            const { data } = await axiosClient.post('/auth/change-password', {
                currentPassword,
                newPassword,
            });
            return data;
        },
        onSuccess: () => {
            toast.success('Password changed');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to change password');
        },
    });
};
