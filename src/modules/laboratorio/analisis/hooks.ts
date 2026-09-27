import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  obtenerAnalisis,
  obtenerAnalisisActivos,
  obtenerAnalisisPorId,
  crearAnalisis,
  actualizarAnalisis,
  eliminarAnalisis,
} from './api';
import type { AnalisisFilters, CreateAnalisisInput, UpdateAnalisisInput } from './types';

// Query keys
export const analisisKeys = {
  all: ['analisis'] as const,
  lists: () => [...analisisKeys.all, 'list'] as const,
  list: (filtros: AnalisisFilters) => [...analisisKeys.lists(), filtros] as const,
  activos: () => [...analisisKeys.all, 'activos'] as const,
  detail: (id: number) => [...analisisKeys.all, 'detail', id] as const,
};

// Hook para obtener análisis con filtros
export const useAnalisis = (filtros: AnalisisFilters = {}) => {
  return useQuery({
    queryKey: analisisKeys.list(filtros),
    queryFn: () => obtenerAnalisis(filtros),
  });
};

// Hook para obtener solo análisis activos
export const useAnalisisActivos = () => {
  return useQuery({
    queryKey: analisisKeys.activos(),
    queryFn: obtenerAnalisisActivos,
  });
};

// Hook para obtener un análisis por ID
export const useAnalisisDetalle = (id: number) => {
  return useQuery({
    queryKey: analisisKeys.detail(id),
    queryFn: () => obtenerAnalisisPorId(id),
    enabled: !!id,
  });
};

// Hook para crear un análisis
export const useCrearAnalisis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: crearAnalisis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analisisKeys.lists() });
      queryClient.invalidateQueries({ queryKey: analisisKeys.activos() });
      message.success('Análisis creado exitosamente');
    },
    onError: () => {
      message.error('Error al crear el análisis');
    },
  });
};

// Hook para actualizar un análisis
export const useActualizarAnalisis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAnalisisInput }) =>
      actualizarAnalisis(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: analisisKeys.lists() });
      queryClient.invalidateQueries({ queryKey: analisisKeys.activos() });
      queryClient.invalidateQueries({ queryKey: analisisKeys.detail(variables.id) });
      message.success('Análisis actualizado exitosamente');
    },
    onError: () => {
      message.error('Error al actualizar el análisis');
    },
  });
};

// Hook para eliminar un análisis
export const useEliminarAnalisis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eliminarAnalisis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analisisKeys.lists() });
      queryClient.invalidateQueries({ queryKey: analisisKeys.activos() });
      message.success('Análisis eliminado exitosamente');
    },
    onError: () => {
      message.error('Error al eliminar el análisis');
    },
  });
};
