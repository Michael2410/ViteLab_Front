import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse } from '../../shared/types/api.types';
import type { Componente, CreateComponenteInput, UpdateComponenteInput, ComponenteFilters } from './types';

const BASE_URL = '/componentes';

// Obtener todos los componentes con filtros y paginación
export const obtenerComponentes = async (filtros?: ComponenteFilters): Promise<Componente[]> => {
  const response = await apiClient.get<ApiResponse<Componente[]>>(BASE_URL, {
    params: filtros,
  });
  return response.data.data;
};

// Obtener solo componentes activos
export const obtenerComponentesActivos = async (): Promise<Componente[]> => {
  const response = await apiClient.get<ApiResponse<Componente[]>>(`${BASE_URL}/activos`);
  return response.data.data;
};

// Obtener componentes por análisis
export const obtenerComponentesPorAnalisis = async (analisisId: number): Promise<Componente[]> => {
  const response = await apiClient.get<ApiResponse<Componente[]>>(`${BASE_URL}/analisis/${analisisId}`);
  return response.data.data;
};

// Obtener un componente por ID
export const obtenerComponentePorId = async (id: number): Promise<Componente> => {
  const response = await apiClient.get<ApiResponse<Componente>>(`${BASE_URL}/${id}`);
  return response.data.data;
};

// Crear un nuevo componente
export const crearComponente = async (data: CreateComponenteInput): Promise<Componente> => {
  const response = await apiClient.post<ApiResponse<Componente>>(BASE_URL, data);
  return response.data.data;
};

// Actualizar un componente existente
export const actualizarComponente = async (id: number, data: UpdateComponenteInput): Promise<Componente> => {
  const response = await apiClient.put<ApiResponse<Componente>>(`${BASE_URL}/${id}`, data);
  return response.data.data;
};

// Eliminar un componente
export const eliminarComponente = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};
