import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  obtenerTiposCliente,
  obtenerTiposClienteActivos,
  obtenerTipoClientePorId,
  crearTipoCliente,
  actualizarTipoCliente,
  eliminarTipoCliente,
} from './api';
import type { TipoClienteFilters, UpdateTipoClienteInput } from './types';

// Query keys
export const tiposClienteKeys = {
  all: ['tipos-cliente'] as const,
  lists: () => [...tiposClienteKeys.all, 'list'] as const,
  list: (filtros: TipoClienteFilters) => [...tiposClienteKeys.lists(), filtros] as const,
  activos: () => [...tiposClienteKeys.all, 'activos'] as const,
  detail: (id: number) => [...tiposClienteKeys.all, 'detail', id] as const,
};

// Hook para obtener tipos de cliente con filtros
export const useTiposCliente = (filtros: TipoClienteFilters = {}) => {
  return useQuery({
    queryKey: tiposClienteKeys.list(filtros),
    queryFn: () => obtenerTiposCliente(filtros),
  });
};

// Hook para obtener solo tipos de cliente activos
export const useTiposClienteActivos = () => {
  return useQuery({
    queryKey: tiposClienteKeys.activos(),
    queryFn: obtenerTiposClienteActivos,
  });
};

// Hook para obtener un tipo de cliente por ID
export const useTipoCliente = (id: number) => {
  return useQuery({
    queryKey: tiposClienteKeys.detail(id),
    queryFn: () => obtenerTipoClientePorId(id),
    enabled: !!id,
  });
};

// Hook para crear un tipo de cliente
export const useCrearTipoCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: crearTipoCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tiposClienteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tiposClienteKeys.activos() });
      message.success('Tipo de cliente creado exitosamente');
    },
    onError: () => {
      message.error('Error al crear el tipo de cliente');
    },
  });
};

// Hook para actualizar un tipo de cliente
export const useActualizarTipoCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTipoClienteInput }) =>
      actualizarTipoCliente(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tiposClienteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tiposClienteKeys.activos() });
      queryClient.invalidateQueries({ queryKey: tiposClienteKeys.detail(variables.id) });
      message.success('Tipo de cliente actualizado exitosamente');
    },
    onError: () => {
      message.error('Error al actualizar el tipo de cliente');
    },
  });
};

// Hook para eliminar un tipo de cliente
export const useEliminarTipoCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eliminarTipoCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tiposClienteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tiposClienteKeys.activos() });
      message.success('Tipo de cliente eliminado exitosamente');
    },
    onError: () => {
      message.error('Error al eliminar el tipo de cliente');
    },
  });
};
