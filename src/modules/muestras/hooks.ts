import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { muestrasApi } from './api';
import type { CreateMuestraInput, UpdateMuestraInput } from './types';

// ============================================
// QUERY KEYS
// ============================================

export const muestrasKeys = {
  all: ['muestras'] as const,
  lists: () => [...muestrasKeys.all, 'list'] as const,
  list: () => [...muestrasKeys.lists()] as const,
  actives: () => [...muestrasKeys.all, 'active'] as const,
  details: () => [...muestrasKeys.all, 'detail'] as const,
  detail: (id: number) => [...muestrasKeys.details(), id] as const,
};

// ============================================
// HOOKS
// ============================================

/**
 * Hook para obtener todas las muestras
 */
export const useMuestras = () => {
  return useQuery({
    queryKey: muestrasKeys.list(),
    queryFn: async () => {
      const response = await muestrasApi.getAll();
      return response.data;
    },
  });
};

/**
 * Hook para obtener muestras activas
 */
export const useMuestrasActivas = () => {
  return useQuery({
    queryKey: muestrasKeys.actives(),
    queryFn: async () => {
      const response = await muestrasApi.getActive();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener una muestra por ID
 */
export const useMuestra = (id: number) => {
  return useQuery({
    queryKey: muestrasKeys.detail(id),
    queryFn: async () => {
      const response = await muestrasApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * Hook para crear muestra
 */
export const useCreateMuestra = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMuestraInput) => muestrasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: muestrasKeys.all });
      message.success('Muestra creada correctamente');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al crear muestra');
    },
  });
};

/**
 * Hook para actualizar muestra
 */
export const useUpdateMuestra = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMuestraInput }) =>
      muestrasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: muestrasKeys.all });
      message.success('Muestra actualizada correctamente');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al actualizar muestra');
    },
  });
};

/**
 * Hook para eliminar muestra
 */
export const useDeleteMuestra = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => muestrasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: muestrasKeys.all });
      message.success('Muestra eliminada correctamente');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al eliminar muestra');
    },
  });
};
