import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse } from '../../shared/types/api.types';
import type { TipoCliente, CreateTipoClienteInput, UpdateTipoClienteInput, TipoClienteFilters } from './types';

const BASE_URL = '/tipos-cliente';

// Obtener todos los tipos de cliente con filtros y paginación
export const obtenerTiposCliente = async (filtros?: TipoClienteFilters): Promise<TipoCliente[]> => {
  const response = await apiClient.get<ApiResponse<TipoCliente[]>>(BASE_URL, {
    params: filtros,
  });
  return response.data.data;
};

// Obtener solo tipos de cliente activos
export const obtenerTiposClienteActivos = async (): Promise<TipoCliente[]> => {
  const response = await apiClient.get<ApiResponse<TipoCliente[]>>(`${BASE_URL}/activos`);
  return response.data.data;
};

// Obtener un tipo de cliente por ID
export const obtenerTipoClientePorId = async (id: number): Promise<TipoCliente> => {
  const response = await apiClient.get<ApiResponse<TipoCliente>>(`${BASE_URL}/${id}`);
  return response.data.data;
};

// Crear un nuevo tipo de cliente
export const crearTipoCliente = async (data: CreateTipoClienteInput): Promise<TipoCliente> => {
  const response = await apiClient.post<ApiResponse<TipoCliente>>(BASE_URL, data);
  return response.data.data;
};

// Actualizar un tipo de cliente existente
export const actualizarTipoCliente = async (id: number, data: UpdateTipoClienteInput): Promise<TipoCliente> => {
  const response = await apiClient.put<ApiResponse<TipoCliente>>(`${BASE_URL}/${id}`, data);
  return response.data.data;
};

// Eliminar un tipo de cliente
export const eliminarTipoCliente = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};
