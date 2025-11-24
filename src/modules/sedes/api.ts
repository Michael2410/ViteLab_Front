import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse } from '../../shared/types/api.types';
import type { Sede, CreateSedeInput, UpdateSedeInput, SedeFilters } from './types';

const BASE_URL = '/sedes';

// Obtener todas las sedes con filtros y paginación
export const obtenerSedes = async (filtros?: SedeFilters): Promise<Sede[]> => {
  const response = await apiClient.get<ApiResponse<Sede[]>>(BASE_URL, {
    params: filtros,
  });
  return response.data.data;
};

// Obtener solo sedes activas
export const obtenerSedesActivas = async (): Promise<Sede[]> => {
  const response = await apiClient.get<ApiResponse<Sede[]>>(`${BASE_URL}/activas`);
  return response.data.data;
};

// Obtener una sede por ID
export const obtenerSedePorId = async (id: number): Promise<Sede> => {
  const response = await apiClient.get<ApiResponse<Sede>>(`${BASE_URL}/${id}`);
  return response.data.data;
};

// Crear una nueva sede
export const crearSede = async (data: CreateSedeInput): Promise<Sede> => {
  const response = await apiClient.post<ApiResponse<Sede>>(BASE_URL, data);
  return response.data.data;
};

// Actualizar una sede existente
export const actualizarSede = async (id: number, data: UpdateSedeInput): Promise<Sede> => {
  const response = await apiClient.put<ApiResponse<Sede>>(`${BASE_URL}/${id}`, data);
  return response.data.data;
};

// Eliminar una sede
export const eliminarSede = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};
