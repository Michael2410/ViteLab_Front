import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse } from '../../shared/types/api.types';
import type { 
  Tarifario, 
  CreateTarifarioInput, 
  UpdateTarifarioInput, 
  TarifarioFilters,
  TarifarioWithPrecios,
  TarifarioPrecio,
  CreateTarifarioPrecioInput,
  UpdateTarifarioPrecioInput,
} from './types';

const BASE_URL = '/tarifarios';

// ============ TARIFARIOS ============

// Obtener todos los tarifarios con filtros y paginación
export const obtenerTarifarios = async (filtros?: TarifarioFilters): Promise<Tarifario[]> => {
  const response = await apiClient.get<ApiResponse<Tarifario[]>>(BASE_URL, {
    params: filtros,
  });
  return response.data.data;
};

// Obtener solo tarifarios activos
export const obtenerTarifariosActivos = async (): Promise<Tarifario[]> => {
  const response = await apiClient.get<ApiResponse<Tarifario[]>>(`${BASE_URL}/active`);
  return response.data.data;
};

// Obtener un tarifario por ID (con sus precios)
export const obtenerTarifarioPorId = async (id: number): Promise<TarifarioWithPrecios> => {
  const response = await apiClient.get<ApiResponse<TarifarioWithPrecios>>(`${BASE_URL}/${id}`);
  return response.data.data;
};

// Crear un nuevo tarifario
export const crearTarifario = async (data: CreateTarifarioInput): Promise<Tarifario> => {
  const response = await apiClient.post<ApiResponse<Tarifario>>(BASE_URL, data);
  return response.data.data;
};

// Actualizar un tarifario existente
export const actualizarTarifario = async (id: number, data: UpdateTarifarioInput): Promise<Tarifario> => {
  const response = await apiClient.put<ApiResponse<Tarifario>>(`${BASE_URL}/${id}`, data);
  return response.data.data;
};

// Eliminar un tarifario
export const eliminarTarifario = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};

// ============ PRECIOS ============

// Crear precio de análisis en tarifario
export const crearTarifarioPrecio = async (data: CreateTarifarioPrecioInput): Promise<TarifarioPrecio> => {
  const response = await apiClient.post<ApiResponse<TarifarioPrecio>>(`${BASE_URL}/precios`, data);
  return response.data.data;
};

// Actualizar precio
export const actualizarTarifarioPrecio = async (id: number, data: UpdateTarifarioPrecioInput): Promise<TarifarioPrecio> => {
  const response = await apiClient.put<ApiResponse<TarifarioPrecio>>(`${BASE_URL}/precios/${id}`, data);
  return response.data.data;
};

// Eliminar precio
export const eliminarTarifarioPrecio = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/precios/${id}`);
};
