import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const KEY = ['ingredients'];

const STALE = 5 * 60 * 1000;
const GC = 15 * 60 * 1000;

export const useIngredients = (params = {}) =>
  useQuery({
    queryKey: [...KEY, params],
    queryFn: async () => {
      const { data } = await axiosClient.get('/ingredients', { params });
      return { items: data.data, pagination: data.pagination };
    },
    staleTime: STALE,
    gcTime: GC,
    placeholderData: keepPreviousData,
  });

export const useIngredient = (slug) =>
  useQuery({
    queryKey: [...KEY, 'slug', slug],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/ingredients/${slug}`);
      return data.data;
    },
    enabled: !!slug,
    staleTime: STALE,
    gcTime: GC,
  });

export const useIngredientById = (id) =>
  useQuery({
    queryKey: [...KEY, 'id', id],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/ingredients/id/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: STALE,
    gcTime: GC,
  });

export const useIngredientProducts = (slug, params = {}) =>
  useQuery({
    queryKey: [...KEY, 'slug', slug, 'products', params],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/ingredients/${slug}/products`, { params });
      return { items: data.data, pagination: data.pagination, ingredient: data.ingredient };
    },
    enabled: !!slug,
    staleTime: STALE,
    gcTime: GC,
    placeholderData: keepPreviousData,
  });

export const useCreateIngredient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await axiosClient.post('/ingredients', payload);
      return data.data;
    },
    onSuccess: () => {
      // `refetchType: 'all'` so list, slug detail, id detail, and the
      // /ingredient/:slug/products query all refresh on next render —
      // covers admin CRUD without a manual reload.
      qc.invalidateQueries({ queryKey: KEY, refetchType: 'all' });
      toast.success('Ingredient created');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create ingredient'),
  });
};

export const useUpdateIngredient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await axiosClient.patch(`/ingredients/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      // `refetchType: 'all'` so list, slug detail, id detail, and the
      // /ingredient/:slug/products query all refresh on next render —
      // covers admin CRUD without a manual reload.
      qc.invalidateQueries({ queryKey: KEY, refetchType: 'all' });
      toast.success('Ingredient updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update ingredient'),
  });
};

export const useDeleteIngredient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await axiosClient.delete(`/ingredients/${id}`);
      return id;
    },
    onSuccess: () => {
      // `refetchType: 'all'` so list, slug detail, id detail, and the
      // /ingredient/:slug/products query all refresh on next render —
      // covers admin CRUD without a manual reload.
      qc.invalidateQueries({ queryKey: KEY, refetchType: 'all' });
      toast.success('Ingredient deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete ingredient'),
  });
};
