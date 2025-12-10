import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse } from '../../shared/types/api.types';
import type {
  OrdenConResultados,
  OrdenParaResultados,
  ResultadoDetalle,
  CreateResultadoInput,
  BulkResultadosInput,
  UpdateResultadoInput,
} from './types';

// ============================================
// ÓRDENES PARA RESULTADOS
// ============================================

/**
 * Obtener órdenes pendientes para ingreso de resultados (REGISTRADA + muestra recepcionada)
 */
export const obtenerOrdenesParaResultados = async (): Promise<OrdenParaResultados[]> => {
  const response = await apiClient.get<ApiResponse<OrdenParaResultados[]>>(
    '/resultados/ordenes-pendientes'
  );
  return response.data.data;
};

/**
 * Obtener órdenes pendientes de aprobación (CON_RESULTADOS)
 */
export const obtenerOrdenesPendientesAprobacion = async (): Promise<OrdenParaResultados[]> => {
  const response = await apiClient.get<ApiResponse<OrdenParaResultados[]>>(
    '/resultados/ordenes-pendientes-aprobacion'
  );
  return response.data.data;
};

/**
 * Obtener orden completa con análisis, componentes y resultados
 */
export const obtenerOrdenConResultados = async (
  ordenId: number
): Promise<OrdenConResultados> => {
  const response = await apiClient.get<ApiResponse<OrdenConResultados>>(
    `/resultados/orden/${ordenId}`
  );
  return response.data.data;
};

/**
 * Guardar resultados sin aprobar
 */
export const guardarResultados = async (
  ordenId: number,
  resultados: BulkResultadosInput['resultados']
): Promise<{ message: string; guardados: number }> => {
  const response = await apiClient.post<ApiResponse<{ message: string; guardados: number }>>(
    `/resultados/orden/${ordenId}/guardar`,
    { resultados }
  );
  return response.data.data;
};

/**
 * Aprobar orden (guardar resultados y cambiar estado a APROBADA)
 */
export const aprobarOrden = async (
  ordenId: number,
  resultados: BulkResultadosInput['resultados']
): Promise<{ message: string }> => {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(
    `/resultados/orden/${ordenId}/aprobar`,
    { resultados }
  );
  return response.data.data;
};

// ============================================
// RESULTADOS CRUD
// ============================================

/**
 * Crear resultado individual
 */
export const crearResultado = async (
  data: CreateResultadoInput
): Promise<ResultadoDetalle> => {
  const response = await apiClient.post<ApiResponse<ResultadoDetalle>>('/resultados', data);
  return response.data.data;
};

/**
 * Crear múltiples resultados (bulk)
 */
export const crearResultadosBulk = async (
  data: BulkResultadosInput
): Promise<{ created: number; resultados: ResultadoDetalle[] }> => {
  const response = await apiClient.post<
    ApiResponse<{ created: number; resultados: ResultadoDetalle[] }>
  >('/resultados/bulk', data);
  return response.data.data;
};

/**
 * Obtener resultado por ID
 */
export const obtenerResultadoPorId = async (id: number): Promise<ResultadoDetalle> => {
  const response = await apiClient.get<ApiResponse<ResultadoDetalle>>(`/resultados/${id}`);
  return response.data.data;
};

/**
 * Obtener resultados con filtros
 */
export const obtenerResultados = async (filters?: {
  orden_id?: number;
  orden_analisis_id?: number;
  componente_id?: number;
}): Promise<ResultadoDetalle[]> => {
  const response = await apiClient.get<ApiResponse<ResultadoDetalle[]>>('/resultados', {
    params: filters,
  });
  return response.data.data;
};

/**
 * Actualizar resultado
 */
export const actualizarResultado = async (
  id: number,
  data: UpdateResultadoInput
): Promise<ResultadoDetalle> => {
  const response = await apiClient.put<ApiResponse<ResultadoDetalle>>(
    `/resultados/${id}`,
    data
  );
  return response.data.data;
};

/**
 * Eliminar resultado
 */
export const eliminarResultado = async (id: number): Promise<void> => {
  await apiClient.delete(`/resultados/${id}`);
};
