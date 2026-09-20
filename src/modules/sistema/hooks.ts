import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { obtenerConfiguracion, actualizarConfiguracion } from './api';
import type { UpdateConfiguracionInput } from './types';

// Query keys
export const sistemaKeys = {
  configuracion: ['sistema', 'configuracion'] as const,
};

/**
 * Hook para obtener la configuración del sistema
 */
export const useConfiguracion = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: sistemaKeys.configuracion,
    queryFn: obtenerConfiguracion,
    ...options,
  });
};

/**
 * Hook para actualizar la configuración del sistema
 */
export const useActualizarConfiguracion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateConfiguracionInput) => actualizarConfiguracion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sistemaKeys.configuracion });
      message.success('Configuración actualizada exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al actualizar configuración');
    },
  });
};
