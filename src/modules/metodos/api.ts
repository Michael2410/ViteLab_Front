import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse } from '../../shared/types/api.types';
import type { Metodo, CreateMetodoInput, UpdateMetodoInput, MetodoFilters } from './types';

const BASE_URL = '/metodos';

// Obtener todos los métodos con filtros y paginación
export const obtenerMetodos = async (filtros?: MetodoFilters): Promise<Metodo[]> => {
  const response = await apiClient.get<ApiResponse<Metodo[]>>(BASE_URL, {
    params: filtros,
  });
  return response.data.data;
};

// Obtener solo métodos activos
export const obtenerMetodosActivos = async (): Promise<Metodo[]> => {
  const response = await apiClient.get<ApiResponse<Metodo[]>>(`${BASE_URL}/active`);
  return response.data.data;
};

// Obtener un método por ID
export const obtenerMetodoPorId = async (id: number): Promise<Metodo> => {
  const response = await apiClient.get<ApiResponse<Metodo>>(`${BASE_URL}/${id}`);
  return response.data.data;
};

// Crear un nuevo método
export const crearMetodo = async (data: CreateMetodoInput): Promise<Metodo> => {
  const response = await apiClient.post<ApiResponse<Metodo>>(BASE_URL, data);
  return response.data.data;
};

// Actualizar un método existente
export const actualizarMetodo = async (id: number, data: UpdateMetodoInput): Promise<Metodo> => {
  const response = await apiClient.put<ApiResponse<Metodo>>(`${BASE_URL}/${id}`, data);
  return response.data.data;
};

// Eliminar un método
export const eliminarMetodo = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};
