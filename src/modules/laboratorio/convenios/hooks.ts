import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  obtenerConvenios,
  obtenerConveniosActivos,
  obtenerConvenioPorId,
  crearConvenio,
  actualizarConvenio,
  eliminarConvenio,
} from './api';
import type { ConvenioFilters, CreateConvenioInput, UpdateConvenioInput } from './types';

// Query keys
export const conveniosKeys = {
  all: ['convenios'] as const,
  lists: () => [...conveniosKeys.all, 'list'] as const,
  list: (filtros: ConvenioFilters) => [...conveniosKeys.lists(), filtros] as const,
  activos: () => [...conveniosKeys.all, 'activos'] as const,
  detail: (id: number) => [...conveniosKeys.all, 'detail', id] as const,
};

// Hook para obtener convenios con filtros
export const useConvenios = (filtros: ConvenioFilters = {}) => {
  return useQuery({
    queryKey: conveniosKeys.list(filtros),
    queryFn: () => obtenerConvenios(filtros),
  });
};

// Hook para obtener solo convenios activos
export const useConveniosActivos = () => {
  return useQuery({
    queryKey: conveniosKeys.activos(),
    queryFn: obtenerConveniosActivos,
  });
};

// Hook para obtener un convenio por ID
export const useConvenio = (id: number) => {
  return useQuery({
    queryKey: conveniosKeys.detail(id),
    queryFn: () => obtenerConvenioPorId(id),
    enabled: !!id,
  });
};

// Hook para crear un convenio
export const useCrearConvenio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: crearConvenio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conveniosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: conveniosKeys.activos() });
      message.success('Convenio creado exitosamente');
    },
    onError: () => {
      message.error('Error al crear el convenio');
    },
  });
};

// Hook para actualizar un convenio
export const useActualizarConvenio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateConvenioInput }) =>
      actualizarConvenio(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: conveniosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: conveniosKeys.activos() });
      queryClient.invalidateQueries({ queryKey: conveniosKeys.detail(variables.id) });
      message.success('Convenio actualizado exitosamente');
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.errors?.map((e: any) => e.message).join(', ') ||
                       'Error al actualizar el convenio';
      message.error(errorMsg);
      console.error('Error detallado:', error.response?.data);
    },
  });
};

// Hook para eliminar un convenio
export const useEliminarConvenio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eliminarConvenio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conveniosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: conveniosKeys.activos() });
      message.success('Convenio eliminado exitosamente');
    },
    onError: () => {
      message.error('Error al eliminar el convenio');
    },
  });
};
