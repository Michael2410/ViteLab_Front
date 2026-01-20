import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  obtenerSedes,
  obtenerSedesActivas,
  obtenerSedePorId,
  crearSede,
  actualizarSede,
  eliminarSede,
} from './api';
import type { SedeFilters, UpdateSedeInput } from './types';

// Query keys
export const sedesKeys = {
  all: ['sedes'] as const,
  lists: () => [...sedesKeys.all, 'list'] as const,
  list: (filtros: SedeFilters) => [...sedesKeys.lists(), filtros] as const,
  activas: () => [...sedesKeys.all, 'activas'] as const,
  detail: (id: number) => [...sedesKeys.all, 'detail', id] as const,
};

// Hook para obtener sedes con filtros
export const useSedes = (filtros: SedeFilters = {}) => {
  return useQuery({
    queryKey: sedesKeys.list(filtros),
    queryFn: () => obtenerSedes(filtros),
  });
};

// Hook para obtener solo sedes activas
export const useSedesActivas = () => {
  return useQuery({
    queryKey: sedesKeys.activas(),
    queryFn: obtenerSedesActivas,
  });
};

// Hook para obtener una sede por ID
export const useSede = (id: number) => {
  return useQuery({
    queryKey: sedesKeys.detail(id),
    queryFn: () => obtenerSedePorId(id),
    enabled: !!id,
  });
};

// Hook para crear una sede
export const useCrearSede = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: crearSede,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sedesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sedesKeys.activas() });
      message.success('Sede creada exitosamente');
    },
    onError: () => {
      message.error('Error al crear la sede');
    },
  });
};

// Hook para actualizar una sede
export const useActualizarSede = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSedeInput }) =>
      actualizarSede(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sedesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sedesKeys.activas() });
      queryClient.invalidateQueries({ queryKey: sedesKeys.detail(variables.id) });
      message.success('Sede actualizada exitosamente');
    },
    onError: () => {
      message.error('Error al actualizar la sede');
    },
  });
};

// Hook para eliminar una sede
export const useEliminarSede = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eliminarSede,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sedesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sedesKeys.activas() });
      message.success('Sede eliminada exitosamente');
    },
    onError: () => {
      message.error('Error al eliminar la sede');
    },
  });
};
