import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  buscarPacientePorDni,
  consultarDni,
  crearOrden,
  obtenerOrdenPorId,
  obtenerOrdenes,
  actualizarOrden,
  actualizarEstadoOrden,
  eliminarOrden,
  recepcionarMuestra,
  obtenerSedesActivas,
  obtenerTiposClienteActivos,
  obtenerConveniosActivos,
  obtenerAreasActivas,
  obtenerAnalisisPorArea,
  buscarAnalisis,
  obtenerMedicos,
} from './api';
import type {
  UpdateOrdenInput,
  UpdateEstadoOrdenInput,
  OrdenFilters,
} from './types';

// ============================================
// QUERY KEYS
// ============================================

export const ordenesKeys = {
  all: ['ordenes'] as const,
  lists: () => [...ordenesKeys.all, 'list'] as const,
  list: (filters?: OrdenFilters) => [...ordenesKeys.lists(), filters] as const,
  details: () => [...ordenesKeys.all, 'detail'] as const,
  detail: (id: number) => [...ordenesKeys.details(), id] as const,
};

export const catalogosKeys = {
  sedes: ['sedes', 'active'] as const,
  tiposCliente: ['tipos-cliente', 'active'] as const,
  convenios: ['convenios', 'active'] as const,
  areas: ['areas', 'active'] as const,
  analisis: (areaId?: number) => ['analisis', 'area', areaId] as const,
};

// ============================================
// HOOKS - PACIENTES
// ============================================

/**
 * Hook para buscar paciente en BD local por DNI
 */
export const useBuscarPacientePorDni = () => {
  return useMutation({
    mutationFn: buscarPacientePorDni,
  });
};

// ============================================
// HOOKS - DNI
// ============================================

/**
 * Hook para consultar DNI en API externa
 */
export const useConsultarDni = () => {
  return useMutation({
    mutationFn: consultarDni,
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al consultar DNI');
    },
  });
};

// ============================================
// HOOKS - ÓRDENES
// ============================================

/**
 * Hook para obtener lista de órdenes
 */
export const useOrdenes = (filters?: OrdenFilters) => {
  return useQuery({
    queryKey: ordenesKeys.list(filters),
    queryFn: () => obtenerOrdenes(filters),
  });
};

/**
 * Hook para obtener detalle de orden
 */
export const useOrdenDetalle = (id: number, enabled = true) => {
  return useQuery({
    queryKey: ordenesKeys.detail(id),
    queryFn: () => obtenerOrdenPorId(id),
    enabled: enabled && id > 0,
  });
};

/**
 * Hook para crear orden
 */
export const useCrearOrden = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: crearOrden,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordenesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: alertasKeys.counts });
      message.success('Orden creada exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al crear orden');
    },
  });
};

/**
 * Hook para actualizar orden
 */
export const useActualizarOrden = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOrdenInput }) =>
      actualizarOrden(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ordenesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ordenesKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: alertasKeys.counts });
      message.success('Orden actualizada exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al actualizar orden');
    },
  });
};

/**
 * Hook para actualizar estado de orden
 */
export const useActualizarEstadoOrden = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEstadoOrdenInput }) =>
      actualizarEstadoOrden(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ordenesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ordenesKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: alertasKeys.counts });
      message.success('Estado actualizado exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al actualizar estado');
    },
  });
};

/**
 * Hook para eliminar orden
 */
export const useEliminarOrden = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eliminarOrden,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordenesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: alertasKeys.counts });
      message.success('Orden eliminada exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al eliminar orden');
    },
  });
};

/**
 * Hook para recepcionar muestra
 */
export const useRecepcionarMuestra = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      console.log('🟡 [HOOK] mutationFn llamada con id:', id);
      return recepcionarMuestra(id);
    },
    onSuccess: (data) => {
      console.log('✅ [HOOK] onSuccess - datos:', data);
      // Invalidar todas las queries de órdenes para forzar refresh
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      queryClient.invalidateQueries({ queryKey: alertasKeys.counts });
      message.success('Muestra recepcionada exitosamente');
    },
    onError: (error: any) => {
      console.error('❌ [HOOK] onError:', error);
      message.error(error.response?.data?.message || 'Error al recepcionar muestra');
    },
  });
};

// ============================================
// HOOKS - CATÁLOGOS
// ============================================

/**
 * Hook para obtener sedes activas
 */
export const useSedesActivas = () => {
  return useQuery({
    queryKey: catalogosKeys.sedes,
    queryFn: obtenerSedesActivas,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener tipos de cliente activos
 */
export const useTiposClienteActivos = () => {
  return useQuery({
    queryKey: catalogosKeys.tiposCliente,
    queryFn: obtenerTiposClienteActivos,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener convenios activos
 */
export const useConveniosActivos = () => {
  return useQuery({
    queryKey: catalogosKeys.convenios,
    queryFn: obtenerConveniosActivos,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener áreas activas
 */
export const useAreasActivas = () => {
  return useQuery({
    queryKey: catalogosKeys.areas,
    queryFn: obtenerAreasActivas,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener análisis por área
 */
export const useAnalisisPorArea = (areaId?: number) => {
  return useQuery({
    queryKey: catalogosKeys.analisis(areaId),
    queryFn: () => obtenerAnalisisPorArea(areaId),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para buscar análisis
 */
export const useBuscarAnalisis = (termino: string, enabled = false) => {
  return useQuery({
    queryKey: ['analisis', 'search', termino],
    queryFn: () => buscarAnalisis(termino),
    enabled: enabled && termino.trim().length >= 2,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook para obtener lista de médicos únicos
 */
export const useMedicos = () => {
  return useQuery({
    queryKey: ['medicos'],
    queryFn: obtenerMedicos,
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================
// HOOKS - ALERTAS
// ============================================

import { obtenerAlertasCounts, marcarOrdenComoImpresa, obtenerPreanalitica } from './api';

export const alertasKeys = {
  counts: ['alertas', 'counts'] as const,
};

/**
 * Hook para obtener conteo de alertas
 */
export const useAlertasCounts = () => {
  return useQuery({
    queryKey: alertasKeys.counts,
    queryFn: obtenerAlertasCounts,
    staleTime: Infinity, // Se consulta 1 vez al cargar la página y luego solo reactivamente por eventos de WebSocket
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para marcar orden como impresa
 */
export const useMarcarOrdenComoImpresa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: marcarOrdenComoImpresa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertasKeys.counts });
      queryClient.invalidateQueries({ queryKey: ordenesKeys.lists() });
      message.success('Orden marcada como impresa');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al marcar orden como impresa');
    },
  });
};

/**
 * Hook para obtener o generar condiciones pre-analíticas por IA (con Smart Polling)
 */
export const usePreanalitica = (ordenId: number, enabled = true) => {
  return useQuery({
    queryKey: [...ordenesKeys.detail(ordenId), 'preanalitica'],
    queryFn: () => obtenerPreanalitica(ordenId),
    enabled: enabled && ordenId > 0,
    refetchInterval: (query) => {
      // Si ya tenemos las condiciones pre-analíticas, detener polling; si aún no están listas, consultar cada 2s
      return query.state.data ? false : 2000;
    },
    refetchIntervalInBackground: false,
    staleTime: 60000,
  });
};
