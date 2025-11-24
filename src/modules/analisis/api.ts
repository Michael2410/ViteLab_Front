import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse } from '../../shared/types/api.types';
import type { Analisis, CreateAnalisisInput, UpdateAnalisisInput, AnalisisFilters } from './types';

const BASE_URL = '/analisis';

// Obtener todos los análisis con filtros y paginación
export const obtenerAnalisis = async (filtros?: AnalisisFilters): Promise<Analisis[]> => {
  const response = await apiClient.get<ApiResponse<Analisis[]>>(BASE_URL, {
    params: filtros,
  });
  return response.data.data;
};

// Obtener solo análisis activos
export const obtenerAnalisisActivos = async (): Promise<Analisis[]> => {
  const response = await apiClient.get<ApiResponse<Analisis[]>>(`${BASE_URL}/activos`);
  return response.data.data;
};

// Obtener un análisis por ID con sus componentes
export const obtenerAnalisisPorId = async (id: number): Promise<Analisis> => {
  const response = await apiClient.get<ApiResponse<Analisis>>(`${BASE_URL}/${id}`);
  return response.data.data;
};

// Crear un nuevo análisis
export const crearAnalisis = async (data: CreateAnalisisInput): Promise<Analisis> => {
  const response = await apiClient.post<ApiResponse<Analisis>>(BASE_URL, data);
  return response.data.data;
};

// Actualizar un análisis existente
export const actualizarAnalisis = async (id: number, data: UpdateAnalisisInput): Promise<Analisis> => {
  const response = await apiClient.put<ApiResponse<Analisis>>(`${BASE_URL}/${id}`, data);
  return response.data.data;
};

// Eliminar un análisis
export const eliminarAnalisis = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};
