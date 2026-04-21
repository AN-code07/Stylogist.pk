import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axiosClient from '../../api/axiosClient';

const SETTINGS_KEY = ['site-settings'];

// Public read — the Footer consumes this on every page. We cache aggressively
// because it changes rarely and is used in the layout shell.
export const useSiteSettings = () => {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => {
      const { data } = await axiosClient.get('/settings');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

// Admin write — PATCH the singleton settings document.
export const useUpdateSiteSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await axiosClient.patch('/settings', payload);
      return data.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(SETTINGS_KEY, data);
      qc.invalidateQueries({ queryKey: SETTINGS_KEY });
      toast.success('Settings saved');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    },
  });
};
