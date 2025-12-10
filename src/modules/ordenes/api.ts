import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse, PaginatedResponse } from '../../shared/types/api.types';
import type {
  ApiDniResponse,
  Paciente,
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
// PACIENTES
// ============================================

/**
 * Buscar paciente por DNI en la base de datos local
 */
export const buscarPacientePorDni = async (dni: string): Promise<Paciente | null> => {
  try {
    const response = await apiClient.get<ApiResponse<Paciente>>(
      `/ordenes/paciente/${dni}`
    );
    return response.data.data;
  } catch (error: any) {
    // Si es 404, retornar null (paciente no encontrado)
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// ============================================
// DNI API
// ============================================

/**
 * Consultar datos de una persona por DNI (API externa RENIEC)
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

/**
 * Recepcionar muestra de una orden
 */
export const recepcionarMuestra = async (id: number): Promise<Orden> => {
  console.log('🟠 [API] recepcionarMuestra llamada con id:', id);
  const response = await apiClient.patch<ApiResponse<Orden>>(
    `/ordenes/${id}/recepcionar-muestra`
  );
  console.log('🟠 [API] Respuesta recibida:', response.data);
  return response.data.data;
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

/**
 * Obtener precios de análisis según tarifario
 */
export interface PrecioAnalisis {
  analisis_id: number;
  nombre: string;
  precio: number;
}

export const obtenerPreciosAnalisis = async (
  analisisIds: number[],
  convenioId?: number
): Promise<PrecioAnalisis[]> => {
  const response = await apiClient.post<ApiResponse<PrecioAnalisis[]>>('/ordenes/precios', {
    analisis_ids: analisisIds,
    convenio_id: convenioId,
  });
  return response.data.data;
};

/**
 * Obtener lista de médicos únicos
 */
export const obtenerMedicos = async (): Promise<string[]> => {
  const response = await apiClient.get<ApiResponse<string[]>>('/ordenes/medicos');
  return response.data.data;
};

// ============================================
// ALERTAS
// ============================================

import type { AlertasCounts } from './types';

/**
 * Obtener conteo de alertas (órdenes aprobadas y pendientes de aprobar)
 */
export const obtenerAlertasCounts = async (): Promise<AlertasCounts> => {
  const response = await apiClient.get<ApiResponse<AlertasCounts>>('/ordenes/alertas');
  return response.data.data;
};

/**
 * Marcar orden como impresa
 */
export const marcarOrdenComoImpresa = async (id: number): Promise<Orden> => {
  const response = await apiClient.patch<ApiResponse<Orden>>(`/ordenes/${id}/imprimir`);
  return response.data.data;
};
