import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  obtenerComponentes,
  obtenerComponentesActivos,
  obtenerComponentesPorAnalisis,
  obtenerComponentePorId,
  crearComponente,
  actualizarComponente,
  eliminarComponente,
} from './api';
import type { ComponenteFilters, CreateComponenteInput, UpdateComponenteInput } from './types';

// Query keys
export const componentesKeys = {
  all: ['componentes'] as const,
  lists: () => [...componentesKeys.all, 'list'] as const,
  list: (filtros: ComponenteFilters) => [...componentesKeys.lists(), filtros] as const,
  activos: () => [...componentesKeys.all, 'activos'] as const,
  byAnalisis: (analisisId: number) => [...componentesKeys.all, 'analisis', analisisId] as const,
  detail: (id: number) => [...componentesKeys.all, 'detail', id] as const,
};

// Hook para obtener componentes con filtros
export const useComponentes = (filtros: ComponenteFilters = {}) => {
  return useQuery({
    queryKey: componentesKeys.list(filtros),
    queryFn: () => obtenerComponentes(filtros),
  });
};

// Hook para obtener solo componentes activos
export const useComponentesActivos = () => {
  return useQuery({
    queryKey: componentesKeys.activos(),
    queryFn: obtenerComponentesActivos,
  });
};

// Hook para obtener componentes por análisis
export const useComponentesPorAnalisis = (analisisId: number) => {
  return useQuery({
    queryKey: componentesKeys.byAnalisis(analisisId),
    queryFn: () => obtenerComponentesPorAnalisis(analisisId),
    enabled: !!analisisId,
  });
};

// Hook para obtener un componente por ID
export const useComponente = (id: number) => {
  return useQuery({
    queryKey: componentesKeys.detail(id),
    queryFn: () => obtenerComponentePorId(id),
    enabled: !!id,
  });
};

// Hook para crear un componente
export const useCrearComponente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: crearComponente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: componentesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: componentesKeys.activos() });
      message.success('Componente creado exitosamente');
    },
    onError: () => {
      message.error('Error al crear el componente');
    },
  });
};

// Hook para actualizar un componente
export const useActualizarComponente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateComponenteInput }) =>
      actualizarComponente(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: componentesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: componentesKeys.activos() });
      queryClient.invalidateQueries({ queryKey: componentesKeys.detail(variables.id) });
      message.success('Componente actualizado exitosamente');
    },
    onError: () => {
      message.error('Error al actualizar el componente');
    },
  });
};

// Hook para eliminar un componente
export const useEliminarComponente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eliminarComponente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: componentesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: componentesKeys.activos() });
      message.success('Componente eliminado exitosamente');
    },
    onError: () => {
      message.error('Error al eliminar el componente');
    },
  });
};
