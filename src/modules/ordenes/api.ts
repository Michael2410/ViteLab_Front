import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse, PaginatedResponse } from '../../shared/types/api.types';
import type {
  ApiDniResponse,
  Orden,
  OrdenDetalle,
  CreateOrdenInput,
  UpdateOrdenInput,
  UpdateEstadoOrdenInput,
  OrdenFilters,
  Sede,
  TipoCliente,
  Convenio,
  Area,
  Analisis,
} from './types';

// ============================================
// DNI API
// ============================================

/**
 * Consultar datos de una persona por DNI
 */
export const consultarDni = async (dni: string): Promise<ApiDniResponse> => {
  const response = await apiClient.get<ApiResponse<any>>(
    `/ordenes/consultar-dni/${dni}`
  );
  
  // El backend devuelve el objeto directamente en data
  return {
    success: true,
    data: response.data.data,
  };
};

// ============================================
// ÓRDENES CRUD
// ============================================

/**
 * Crear nueva orden
 */
export const crearOrden = async (data: CreateOrdenInput): Promise<OrdenDetalle> => {
  const response = await apiClient.post<ApiResponse<OrdenDetalle>>('/ordenes', data);
  return response.data.data;
};

/**
 * Obtener orden por ID
 */
export const obtenerOrdenPorId = async (id: number): Promise<OrdenDetalle> => {
  const response = await apiClient.get<ApiResponse<OrdenDetalle>>(`/ordenes/${id}`);
  return response.data.data;
};

/**
 * Obtener lista de órdenes con filtros
 */
export const obtenerOrdenes = async (
  filters?: OrdenFilters
): Promise<PaginatedResponse<Orden>> => {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<Orden>>>('/ordenes', {
    params: filters,
  });
  return response.data.data;
};

/**
 * Actualizar orden
 */
export const actualizarOrden = async (
  id: number,
  data: UpdateOrdenInput
): Promise<OrdenDetalle> => {
  const response = await apiClient.put<ApiResponse<OrdenDetalle>>(`/ordenes/${id}`, data);
  return response.data.data;
};

/**
 * Actualizar estado de orden
 */
export const actualizarEstadoOrden = async (
  id: number,
  data: UpdateEstadoOrdenInput
): Promise<OrdenDetalle> => {
  const response = await apiClient.patch<ApiResponse<OrdenDetalle>>(
    `/ordenes/${id}/estado`,
    data
  );
  return response.data.data;
};

/**
 * Eliminar orden
 */
export const eliminarOrden = async (id: number): Promise<void> => {
  await apiClient.delete(`/ordenes/${id}`);
};

// ============================================
// CATÁLOGOS (para formularios)
// ============================================

/**
 * Obtener todas las sedes activas
 */
export const obtenerSedesActivas = async (): Promise<Sede[]> => {
  const response = await apiClient.get<ApiResponse<Sede[]>>('/sedes/active');
  return response.data.data;
};

/**
 * Obtener todos los tipos de cliente activos
 */
export const obtenerTiposClienteActivos = async (): Promise<TipoCliente[]> => {
  const response = await apiClient.get<ApiResponse<TipoCliente[]>>('/tipos-cliente/active');
  return response.data.data;
};

/**
 * Obtener todos los convenios activos
 */
export const obtenerConveniosActivos = async (): Promise<Convenio[]> => {
  const response = await apiClient.get<ApiResponse<Convenio[]>>('/convenios/active');
  return response.data.data;
};

/**
 * Obtener todas las áreas activas
 */
export const obtenerAreasActivas = async (): Promise<Area[]> => {
  const response = await apiClient.get<ApiResponse<Area[]>>('/areas/active');
  return response.data.data;
};

/**
 * Obtener análisis por área
 */
export const obtenerAnalisisPorArea = async (areaId?: number): Promise<Analisis[]> => {
  const url = areaId ? `/analisis?area_id=${areaId}` : '/analisis';
  const response = await apiClient.get<ApiResponse<PaginatedResponse<Analisis>>>(url);
  return response.data.data.items;
};

/**
 * Buscar análisis por término
 */
export const buscarAnalisis = async (termino: string): Promise<Analisis[]> => {
  if (!termino || termino.trim().length < 2) {
    return [];
  }
  const response = await apiClient.get<ApiResponse<Analisis[]>>('/analisis/search', {
    params: { q: termino },
  });
  return response.data.data;
};
