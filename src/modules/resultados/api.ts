import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse } from '../../shared/types/api.types';
import type {
  OrdenConResultados,
  ResultadoDetalle,
  CreateResultadoInput,
  BulkResultadosInput,
  UpdateResultadoInput,
} from './types';

// ============================================
// OBTENER ORDEN CON RESULTADOS
// ============================================

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
