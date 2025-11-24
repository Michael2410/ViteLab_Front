import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse } from '../../shared/types/api.types';
import type { Tarifario, CreateTarifarioInput, UpdateTarifarioInput, TarifarioFilters } from './types';

const BASE_URL = '/tarifarios';

// Obtener todos los tarifarios con filtros y paginación
export const obtenerTarifarios = async (filtros?: TarifarioFilters): Promise<Tarifario[]> => {
  const response = await apiClient.get<ApiResponse<Tarifario[]>>(BASE_URL, {
    params: filtros,
  });
  return response.data.data;
};

// Obtener solo tarifarios activos
export const obtenerTarifariosActivos = async (): Promise<Tarifario[]> => {
  const response = await apiClient.get<ApiResponse<Tarifario[]>>(`${BASE_URL}/activos`);
  return response.data.data;
};

// Obtener un tarifario por ID
export const obtenerTarifarioPorId = async (id: number): Promise<Tarifario> => {
  const response = await apiClient.get<ApiResponse<Tarifario>>(`${BASE_URL}/${id}`);
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
