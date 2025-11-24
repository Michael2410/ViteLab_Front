import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse } from '../../shared/types/api.types';
import type { Area, CreateAreaInput, UpdateAreaInput, AreaFilters } from './types';

// ============================================
// ÁREAS CRUD
// ============================================

/**
 * Obtener todas las áreas con paginación y filtros
 */
export const obtenerAreas = async (filters?: AreaFilters): Promise<Area[]> => {
  const response = await apiClient.get<ApiResponse<Area[]>>('/areas', {
    params: filters,
  });
  return response.data.data;
};

/**
 * Obtener áreas activas (sin paginación)
 */
export const obtenerAreasActivas = async (): Promise<Area[]> => {
  const response = await apiClient.get<ApiResponse<Area[]>>('/areas/active');
  return response.data.data;
};

/**
 * Obtener área por ID
 */
export const obtenerAreaPorId = async (id: number): Promise<Area> => {
  const response = await apiClient.get<ApiResponse<Area>>(`/areas/${id}`);
  return response.data.data;
};

/**
 * Crear nueva área
 */
export const crearArea = async (data: CreateAreaInput): Promise<Area> => {
  const response = await apiClient.post<ApiResponse<Area>>('/areas', data);
  return response.data.data;
};

/**
 * Actualizar área
 */
export const actualizarArea = async (id: number, data: UpdateAreaInput): Promise<Area> => {
  const response = await apiClient.put<ApiResponse<Area>>(`/areas/${id}`, data);
  return response.data.data;
};

/**
 * Eliminar área
 */
export const eliminarArea = async (id: number): Promise<void> => {
  await apiClient.delete(`/areas/${id}`);
};
