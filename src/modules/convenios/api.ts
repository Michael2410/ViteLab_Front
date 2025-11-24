import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse } from '../../shared/types/api.types';
import type { Convenio, CreateConvenioInput, UpdateConvenioInput, ConvenioFilters } from './types';

const BASE_URL = '/convenios';

// Obtener todos los convenios con filtros y paginación
export const obtenerConvenios = async (filtros?: ConvenioFilters): Promise<Convenio[]> => {
  const response = await apiClient.get<ApiResponse<Convenio[]>>(BASE_URL, {
    params: filtros,
  });
  return response.data.data;
};

// Obtener solo convenios activos
export const obtenerConveniosActivos = async (): Promise<Convenio[]> => {
  const response = await apiClient.get<ApiResponse<Convenio[]>>(`${BASE_URL}/activos`);
  return response.data.data;
};

// Obtener un convenio por ID
export const obtenerConvenioPorId = async (id: number): Promise<Convenio> => {
  const response = await apiClient.get<ApiResponse<Convenio>>(`${BASE_URL}/${id}`);
  return response.data.data;
};

// Crear un nuevo convenio
export const crearConvenio = async (data: CreateConvenioInput): Promise<Convenio> => {
  const response = await apiClient.post<ApiResponse<Convenio>>(BASE_URL, data);
  return response.data.data;
};

// Actualizar un convenio existente
export const actualizarConvenio = async (id: number, data: UpdateConvenioInput): Promise<Convenio> => {
  const response = await apiClient.put<ApiResponse<Convenio>>(`${BASE_URL}/${id}`, data);
  return response.data.data;
};

// Eliminar un convenio
export const eliminarConvenio = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};
