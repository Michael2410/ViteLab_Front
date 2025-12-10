import apiClient from '../../shared/utils/apiClient';
import type { ConfiguracionSistema, UpdateConfiguracionInput, DashboardStats } from './types';
import type { ApiResponse } from '../../shared/types/api.types';

/**
 * Obtener configuración del sistema
 */
export const obtenerConfiguracion = async (): Promise<ConfiguracionSistema> => {
  const response = await apiClient.get<ApiResponse<ConfiguracionSistema>>('/sistema/configuracion');
  return response.data.data;
};

/**
 * Actualizar configuración del sistema
 */
export const actualizarConfiguracion = async (
  data: UpdateConfiguracionInput
): Promise<ConfiguracionSistema> => {
  const response = await apiClient.put<ApiResponse<ConfiguracionSistema>>(
    '/sistema/configuracion',
    data
  );
  return response.data.data;
};

/**
 * Obtener estadísticas del dashboard
 */
export const obtenerDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get<ApiResponse<DashboardStats>>('/sistema/dashboard');
  return response.data.data;
};
