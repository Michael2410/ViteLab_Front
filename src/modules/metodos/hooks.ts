import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  obtenerMetodos,
  obtenerMetodosActivos,
  obtenerMetodoPorId,
  crearMetodo,
  actualizarMetodo,
  eliminarMetodo,
} from './api';
import type { MetodoFilters, UpdateMetodoInput } from './types';

// Query keys
export const metodosKeys = {
  all: ['metodos'] as const,
  lists: () => [...metodosKeys.all, 'list'] as const,
  list: (filtros: MetodoFilters) => [...metodosKeys.lists(), filtros] as const,
  activos: () => [...metodosKeys.all, 'activos'] as const,
  detail: (id: number) => [...metodosKeys.all, 'detail', id] as const,
};

// Hook para obtener métodos con filtros
export const useMetodos = (filtros: MetodoFilters = {}) => {
  return useQuery({
    queryKey: metodosKeys.list(filtros),
    queryFn: () => obtenerMetodos(filtros),
  });
};

// Hook para obtener solo métodos activos
export const useMetodosActivos = () => {
  return useQuery({
    queryKey: metodosKeys.activos(),
    queryFn: obtenerMetodosActivos,
  });
};

// Hook para obtener un método por ID
export const useMetodo = (id: number) => {
  return useQuery({
    queryKey: metodosKeys.detail(id),
    queryFn: () => obtenerMetodoPorId(id),
    enabled: !!id,
  });
};

// Hook para crear un método
export const useCrearMetodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: crearMetodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metodosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: metodosKeys.activos() });
      message.success('Método creado exitosamente');
    },
    onError: () => {
      message.error('Error al crear el método');
    },
  });
};

// Hook para actualizar un método
export const useActualizarMetodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMetodoInput }) =>
      actualizarMetodo(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: metodosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: metodosKeys.activos() });
      queryClient.invalidateQueries({ queryKey: metodosKeys.detail(variables.id) });
      message.success('Método actualizado exitosamente');
    },
    onError: () => {
      message.error('Error al actualizar el método');
    },
  });
};

// Hook para eliminar un método
export const useEliminarMetodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eliminarMetodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metodosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: metodosKeys.activos() });
      message.success('Método eliminado exitosamente');
    },
    onError: () => {
      message.error('Error al eliminar el método');
    },
  });
};
