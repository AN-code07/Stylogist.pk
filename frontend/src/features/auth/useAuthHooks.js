import { useMutation, useQuery } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// --- 4. SIGNUP HOOK ---
export const useSignup = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (userData) => {
            const { data } = await axiosClient.post('/auth/register', userData);
            return data;
        },
        onSuccess: (_data, variables) => {
            toast.success(`OTP has been sent to ${variables.email}`);
            navigate('/verify-otp', { state: { email: variables.email, flow: 'registration' } });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Registration failed");
        }
    });
};

// --- 1. LOGIN HOOK ---
export const useLogin = () => {
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (credentials) => {
            const { data } = await axiosClient.post('/auth/login', credentials);
            return data.data?.user || data.user;
        },
        onSuccess: (user) => {
            setAuth(user);
            toast.success("Welcome back to Stylogist!");
            navigate('/');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Login failed. Please check your credentials.");
        }
    });
};

// --- 2. LOGOUT HOOK ---
export const useLogout = () => {
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async () => {
            await axiosClient.post('/auth/logout');
            localStorage.removeItem("user");
        },
        onSuccess: () => {
            clearAuth();
            navigate('/');
        },
    });
};

// --- 3. CHECK AUTH HOOK (Run on App Mount) ---
export const useCheckAuth = () => {
    const setAuth = useAuthStore((state) => state.setAuth);
    const clearAuth = useAuthStore((state) => state.clearAuth);

    return useQuery({
        queryKey: ['authUser'],
        queryFn: async () => {
            try {
                const { data } = await axiosClient.get('/auth/me');
                setAuth(data.user);
                return data.user;
            } catch (error) {
                clearAuth();
                throw error;
            }
        },
        retry: false,
        refetchOnWindowFocus: false,
    });
};

// --- 5. VERIFY OTP HOOK ---
// Intentionally does NOT navigate / call setAuth here. Behavior depends on the `flow`
// (registration -> /login, reset -> /reset-password), so the caller owns the onSuccess.
export const useVerifyOTP = () => {
    return useMutation({
        mutationFn: async (otpData) => {
            const { data } = await axiosClient.post('/auth/verify-otp', otpData);
            return data;
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Invalid OTP");
        }
    });
};

// --- 6. REQUEST OTP (RESEND) HOOK ---
export const useRequestOTP = () => {
    return useMutation({
        mutationFn: async (emailData) => {
            const { data } = await axiosClient.post('/auth/request-otp', emailData);
            return data;
        },
        onSuccess: () => {
            toast.success("A new code has been sent to your email.");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to resend code");
        }
    });
};

export const useForgotPassword = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (emailData) => {
            const { data } = await axiosClient.post('/auth/forgot-password', emailData);
            return data;
        },
        onSuccess: (_data, variables) => {
            toast.success("Reset code sent to your email!");
            navigate('/verify-otp', {
                state: { email: variables.email, flow: 'reset' }
            });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "User not found");
        }
    });
};

// --- 7. RESET PASSWORD HOOK ---
export const useResetPassword = () => {
    const navigate = useNavigate();
    const clearAuth = useAuthStore((state) => state.clearAuth);

    return useMutation({
        mutationFn: async (passwordData) => {
            const { data } = await axiosClient.post('/auth/reset-password', passwordData);
            return data;
        },
        onSuccess: async () => {
            // After reset the old JWT is invalidated by passwordChangedAt; force a fresh login
            // so the session state is unambiguous rather than silently relying on the new cookie.
            try { await axiosClient.post('/auth/logout'); } catch { /* ignore */ }
            clearAuth();
            toast.success("Password reset successful! Please sign in with your new password.");
            navigate('/login');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Session expired. Please verify your OTP again.");
        }
    });
};
