import { useMutation, useQuery } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // Highly recommended for Stylogist UX

// --- 4. SIGNUP HOOK ---
export const useSignup = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (userData) => {
            // Backend creates the user and dispatches the OTP email
            console.log("user data", userData);
            navigate('/verify-otp', { state: { email: userData.email, flow: 'registration' } });
            console.log('navigate on trigger')
            const { data } = await axiosClient.post('/auth/register', userData);
            return data;
        },
        onSuccess: (data, variables) => {
            // Route the user to the OTP page. 
            // We pass the email in the router state so the OTP page knows who to verify!
            toast.success(`OTP has been sent to ${variables.email}`)
            console.log('trigger on success ')
            // navigate('/verify-otp', { state: { email: variables.email, flow: 'registration' } });
        },
        onError: (error) => {
            // In production, you'd wire this to a toast notification system (like react-hot-toast)
            console.error("Registration failed:", error.response?.data?.message || "An error occurred");
        }
    });
};

// --- 1. LOGIN HOOK ---
export const useLogin = () => {
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (credentials) => {
            // Backend sets the HTTP-Only cookie and returns the user object
            const { data } = await axiosClient.post('/auth/login', credentials);
            
            // Handles both { user: {...} } and { data: { user: {...} } } response structures
            return data.data?.user || data.user; 
        },
        onSuccess: (user) => {
            setAuth(user); // Save user to Zustand
            toast.success("Welcome back to Stylogist!"); // Success Notification
            navigate('/'); // Redirect to store/dashboard
        },
        onError: (error) => {
            // Gracefully catch the ApiError message from your backend (e.g., "Incorrect email or password")
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
            // Backend clears the HTTP-Only cookie
            await axiosClient.post('/auth/logout');
        },
        onSuccess: () => {
            clearAuth(); // Wipe user from Zustand
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
                // Backend verifies the cookie and returns the user
                const { data } = await axiosClient.get('/auth/me');
                setAuth(data.user);
                return data.user;
            } catch (error) {
                clearAuth(); // Cookie is invalid or expired
                throw error;
            }
        },
        retry: false, // Don't retry if it fails (user is simply logged out)
        refetchOnWindowFocus: false,
    });
};


// --- 5. VERIFY OTP HOOK ---
export const useVerifyOTP = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    return useMutation({
        mutationFn: async (otpData) => {

            console.log("otp data", otpData);


            // otpData: { email, otp }
            const { data } = await axiosClient.post('/auth/verify-otp', otpData);
            return data;
        },
        onSuccess: (data) => {
            // Backend sets the cookie, Zustand sets the user
            setAuth(data.data.user);
            toast.success("Account verified successfully!");
            navigate('/login'); // Take them to the shop
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
            // Hits: router.post('/forgot-password', ...)
            const { data } = await axiosClient.post('/auth/forgot-password', emailData);
            return data;
        },
        onSuccess: (data, variables) => {
            // Move to OTP page and tell it we are in the 'reset' flow
            navigate('/verify-otp', {
                state: {
                    email: variables.email,
                    flow: 'reset'
                }
            });
            toast.success("Reset code sent to your email!");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "User not found");
        }
    });
};


// --- 7. RESET PASSWORD HOOK ---
// --- 7. RESET PASSWORD HOOK ---
export const useResetPassword = () => {
    // Notice: We no longer need to pass (token) into the hook!
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    return useMutation({
        mutationFn: async (passwordData) => {
            // passwordData: { password, confirmPassword }
            // The httpOnly cookie is sent automatically by axiosClient!
            const { data } = await axiosClient.post('/auth/reset-password', passwordData);
            return data;
        },
        onSuccess: (data) => {
            setAuth(data.data.user); // Update global state with the fresh user data
            toast.success("Password reset successful!");
            navigate('/login'); // Redirect to the store/dashboard
        },
        onError: (error) => {
            // Updated error message to reflect the cookie-based session
            toast.error(error.response?.data?.message || "Session expired. Please verify your OTP again.");
        }
    });
};