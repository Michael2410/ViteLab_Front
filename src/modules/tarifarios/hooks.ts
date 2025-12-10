import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  obtenerTarifarios,
  obtenerTarifariosActivos,
  obtenerTarifarioPorId,
  crearTarifario,
  actualizarTarifario,
  eliminarTarifario,
  crearTarifarioPrecio,
  actualizarTarifarioPrecio,
  eliminarTarifarioPrecio,
} from './api';
import type { 
  TarifarioFilters, 
  CreateTarifarioInput, 
  UpdateTarifarioInput,
  CreateTarifarioPrecioInput,
  UpdateTarifarioPrecioInput,
} from './types';

// Query keys
export const tarifariosKeys = {
  all: ['tarifarios'] as const,
  lists: () => [...tarifariosKeys.all, 'list'] as const,
  list: (filtros: TarifarioFilters) => [...tarifariosKeys.lists(), filtros] as const,
  activos: () => [...tarifariosKeys.all, 'activos'] as const,
  detail: (id: number) => [...tarifariosKeys.all, 'detail', id] as const,
};

// Hook para obtener tarifarios con filtros
export const useTarifarios = (filtros: TarifarioFilters = {}) => {
  return useQuery({
    queryKey: tarifariosKeys.list(filtros),
    queryFn: () => obtenerTarifarios(filtros),
  });
};

// Hook para obtener solo tarifarios activos
export const useTarifariosActivos = () => {
  return useQuery({
    queryKey: tarifariosKeys.activos(),
    queryFn: obtenerTarifariosActivos,
  });
};

// Hook para obtener un tarifario por ID (con precios)
export const useTarifario = (id: number) => {
  return useQuery({
    queryKey: tarifariosKeys.detail(id),
    queryFn: () => obtenerTarifarioPorId(id),
    enabled: !!id,
  });
};

// Hook para crear un tarifario
export const useCrearTarifario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: crearTarifario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tarifariosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tarifariosKeys.activos() });
      message.success('Tarifario creado exitosamente');
    },
    onError: () => {
      message.error('Error al crear el tarifario');
    },
  });
};

// Hook para actualizar un tarifario
export const useActualizarTarifario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTarifarioInput }) =>
      actualizarTarifario(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tarifariosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tarifariosKeys.activos() });
      queryClient.invalidateQueries({ queryKey: tarifariosKeys.detail(variables.id) });
      message.success('Tarifario actualizado exitosamente');
    },
    onError: () => {
      message.error('Error al actualizar el tarifario');
    },
  });
};

// Hook para eliminar un tarifario
export const useEliminarTarifario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eliminarTarifario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tarifariosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tarifariosKeys.activos() });
      message.success('Tarifario eliminado exitosamente');
    },
    onError: () => {
      message.error('Error al eliminar el tarifario');
    },
  });
};

// ============ PRECIOS ============

// Hook para crear precio
export const useCrearTarifarioPrecio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: crearTarifarioPrecio,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tarifariosKeys.detail(variables.tarifario_id) });
      message.success('Análisis agregado al tarifario');
    },
    onError: () => {
      message.error('Error al agregar el análisis');
    },
  });
};

// Hook para actualizar precio
export const useActualizarTarifarioPrecio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tarifarioId, data }: { id: number; tarifarioId: number; data: UpdateTarifarioPrecioInput }) =>
      actualizarTarifarioPrecio(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tarifariosKeys.detail(variables.tarifarioId) });
      message.success('Precio actualizado');
    },
    onError: () => {
      message.error('Error al actualizar el precio');
    },
  });
};

// Hook para eliminar precio
export const useEliminarTarifarioPrecio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tarifarioId }: { id: number; tarifarioId: number }) =>
      eliminarTarifarioPrecio(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tarifariosKeys.detail(variables.tarifarioId) });
      message.success('Análisis eliminado del tarifario');
    },
    onError: () => {
      message.error('Error al eliminar el análisis');
    },
  });
};
