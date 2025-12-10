import apiClient from '../../shared/utils/apiClient';
import type { Muestra, CreateMuestraInput, UpdateMuestraInput } from './types';
import type { ApiResponse } from '../../shared/types/api.types';

export const muestrasApi = {
  getAll: async (): Promise<ApiResponse<Muestra[]>> => {
    const response = await apiClient.get<ApiResponse<Muestra[]>>('/muestras');
    return response.data;
  },

  getActive: async (): Promise<ApiResponse<Muestra[]>> => {
    const response = await apiClient.get<ApiResponse<Muestra[]>>('/muestras/active');
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Muestra>> => {
    const response = await apiClient.get<ApiResponse<Muestra>>(`/muestras/${id}`);
    return response.data;
  },

  create: async (data: CreateMuestraInput): Promise<ApiResponse<Muestra>> => {
    const response = await apiClient.post<ApiResponse<Muestra>>('/muestras', data);
    return response.data;
  },

  update: async (id: number, data: UpdateMuestraInput): Promise<ApiResponse<Muestra>> => {
    const response = await apiClient.put<ApiResponse<Muestra>>(`/muestras/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/muestras/${id}`);
    return response.data;
  },
};
