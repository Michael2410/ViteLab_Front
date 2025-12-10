import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  obtenerOrdenesParaResultados,
  obtenerOrdenesPendientesAprobacion,
  obtenerOrdenConResultados,
  guardarResultados,
  aprobarOrden,
  crearResultado,
  crearResultadosBulk,
  obtenerResultadoPorId,
  obtenerResultados,
  actualizarResultado,
  eliminarResultado,
} from './api';
import type { UpdateResultadoInput, BulkResultadosInput } from './types';

// ============================================
// QUERY KEYS
// ============================================

export const resultadosKeys = {
  all: ['resultados'] as const,
  ordenesPendientes: ['resultados', 'ordenes-pendientes'] as const,
  ordenesPendientesAprobacion: ['resultados', 'ordenes-pendientes-aprobacion'] as const,
  ordenConResultados: (ordenId: number) => ['resultados', 'orden', ordenId] as const,
  lists: () => [...resultadosKeys.all, 'list'] as const,
  list: (filters?: any) => [...resultadosKeys.lists(), filters] as const,
  details: () => [...resultadosKeys.all, 'detail'] as const,
  detail: (id: number) => [...resultadosKeys.details(), id] as const,
};

// ============================================
// HOOKS - ÓRDENES PARA RESULTADOS
// ============================================

/**
 * Hook para obtener órdenes pendientes para ingreso de resultados (REGISTRADA + muestra recepcionada)
 */
export const useOrdenesParaResultados = () => {
  return useQuery({
    queryKey: resultadosKeys.ordenesPendientes,
    queryFn: obtenerOrdenesParaResultados,
  });
};

/**
 * Hook para obtener órdenes pendientes de aprobación (CON_RESULTADOS)
 */
export const useOrdenesPendientesAprobacion = () => {
  return useQuery({
    queryKey: resultadosKeys.ordenesPendientesAprobacion,
    queryFn: obtenerOrdenesPendientesAprobacion,
  });
};

/**
 * Hook para obtener orden con análisis y resultados
 */
export const useOrdenConResultados = (ordenId: number, enabled = true) => {
  return useQuery({
    queryKey: resultadosKeys.ordenConResultados(ordenId),
    queryFn: () => obtenerOrdenConResultados(ordenId),
    enabled: enabled && ordenId > 0,
  });
};

/**
 * Hook para guardar resultados sin aprobar
 */
export const useGuardarResultados = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ordenId, resultados }: { ordenId: number; resultados: BulkResultadosInput['resultados'] }) =>
      guardarResultados(ordenId, resultados),
    onSuccess: (_, variables) => {
      // Invalidar la orden específica
      queryClient.invalidateQueries({ queryKey: resultadosKeys.ordenConResultados(variables.ordenId) });
      // Invalidar lista de órdenes pendientes para que se actualice la tabla
      queryClient.invalidateQueries({ queryKey: resultadosKeys.ordenesPendientes });
      // Invalidar órdenes pendientes de aprobación
      queryClient.invalidateQueries({ queryKey: resultadosKeys.ordenesPendientesAprobacion });
      message.success('Resultados guardados exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al guardar resultados');
    },
  });
};

/**
 * Hook para aprobar orden (guardar y cambiar estado)
 */
export const useAprobarOrden = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ordenId, resultados }: { ordenId: number; resultados: BulkResultadosInput['resultados'] }) =>
      aprobarOrden(ordenId, resultados),
    onSuccess: () => {
      // Invalidar todas las listas relacionadas
      queryClient.invalidateQueries({ queryKey: resultadosKeys.ordenesPendientes });
      queryClient.invalidateQueries({ queryKey: resultadosKeys.ordenesPendientesAprobacion });
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      message.success('Orden aprobada exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al aprobar orden');
    },
  });
};

// ============================================
// HOOKS - RESULTADOS
// ============================================

/**
 * Hook para obtener lista de resultados
 */
export const useResultados = (filters?: {
  orden_id?: number;
  orden_analisis_id?: number;
  componente_id?: number;
}) => {
  return useQuery({
    queryKey: resultadosKeys.list(filters),
    queryFn: () => obtenerResultados(filters),
  });
};

/**
 * Hook para obtener detalle de resultado
 */
export const useResultadoDetalle = (id: number, enabled = true) => {
  return useQuery({
    queryKey: resultadosKeys.detail(id),
    queryFn: () => obtenerResultadoPorId(id),
    enabled: enabled && id > 0,
  });
};

/**
 * Hook para crear resultado individual
 */
export const useCrearResultado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: crearResultado,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: resultadosKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: resultadosKeys.ordenConResultados(data.orden_id),
      });
      message.success('Resultado registrado exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al registrar resultado');
    },
  });
};

/**
 * Hook para crear múltiples resultados (bulk)
 */
export const useCrearResultadosBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: crearResultadosBulk,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: resultadosKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: resultadosKeys.ordenConResultados(variables.orden_id),
      });
      // Invalidar también las órdenes para actualizar el estado
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      message.success(
        `${data.created} resultados registrados. Orden actualizada a CON_RESULTADOS`
      );
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al registrar resultados');
    },
  });
};

/**
 * Hook para actualizar resultado
 */
export const useActualizarResultado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateResultadoInput }) =>
      actualizarResultado(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: resultadosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: resultadosKeys.detail(data.id) });
      queryClient.invalidateQueries({
        queryKey: resultadosKeys.ordenConResultados(data.orden_id),
      });
      message.success('Resultado actualizado exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al actualizar resultado');
    },
  });
};

/**
 * Hook para eliminar resultado
 */
export const useEliminarResultado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eliminarResultado,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resultadosKeys.lists() });
      message.success('Resultado eliminado exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al eliminar resultado');
    },
  });
};
