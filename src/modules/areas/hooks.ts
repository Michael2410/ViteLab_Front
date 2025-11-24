import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  obtenerAreas,
  obtenerAreasActivas,
  obtenerAreaPorId,
  crearArea,
  actualizarArea,
  eliminarArea,
} from './api';
import type { AreaFilters, CreateAreaInput, UpdateAreaInput } from './types';

// ============================================
// QUERY KEYS
// ============================================

export const areasKeys = {
  all: ['areas'] as const,
  lists: () => [...areasKeys.all, 'list'] as const,
  list: (filters?: AreaFilters) => [...areasKeys.lists(), filters] as const,
  actives: () => [...areasKeys.all, 'active'] as const,
  details: () => [...areasKeys.all, 'detail'] as const,
  detail: (id: number) => [...areasKeys.details(), id] as const,
};

// ============================================
// HOOKS
// ============================================

/**
 * Hook para obtener áreas con paginación
 */
export const useAreas = (filters?: AreaFilters) => {
  return useQuery({
    queryKey: areasKeys.list(filters),
    queryFn: () => obtenerAreas(filters),
  });
};

/**
 * Hook para obtener áreas activas
 */
export const useAreasActivas = () => {
  return useQuery({
    queryKey: areasKeys.actives(),
    queryFn: obtenerAreasActivas,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener área por ID
 */
export const useAreaDetalle = (id: number, enabled = true) => {
  return useQuery({
    queryKey: areasKeys.detail(id),
    queryFn: () => obtenerAreaPorId(id),
    enabled: enabled && id > 0,
  });
};

/**
 * Hook para crear área
 */
export const useCrearArea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAreaInput) => crearArea(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: areasKeys.actives() });
      message.success('Área creada exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al crear área');
    },
  });
};

/**
 * Hook para actualizar área
 */
export const useActualizarArea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAreaInput }) =>
      actualizarArea(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: areasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: areasKeys.actives() });
      queryClient.invalidateQueries({ queryKey: areasKeys.detail(data.id) });
      message.success('Área actualizada exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al actualizar área');
    },
  });
};

/**
 * Hook para eliminar área
 */
export const useEliminarArea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eliminarArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: areasKeys.actives() });
      message.success('Área eliminada exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al eliminar área');
    },
  });
};
