import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plantillasApi } from './plantillas.api';
import type { CrearPlantillaDTO, ActualizarPlantillaDTO } from './plantillas.types';

export const PLANTILLAS_QUERY_KEY = ['personal', 'documentos', 'plantillas'];

export const usePlantillas = () => {
  return useQuery({
    queryKey: PLANTILLAS_QUERY_KEY,
    queryFn: plantillasApi.listar,
  });
};

export const usePlantilla = (id: number) => {
  return useQuery({
    queryKey: [...PLANTILLAS_QUERY_KEY, id],
    queryFn: () => plantillasApi.obtener(id),
    enabled: !!id,
  });
};

export const usePlantillaPorTipo = (tipo: string, enabled = true) => {
  return useQuery({
    queryKey: [...PLANTILLAS_QUERY_KEY, 'tipo', tipo],
    queryFn: () => plantillasApi.obtenerPorTipo(tipo),
    enabled: enabled && !!tipo,
    retry: false,
  });
};

export const useCrearPlantilla = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CrearPlantillaDTO) => plantillasApi.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLANTILLAS_QUERY_KEY });
    },
  });
};

export const useActualizarPlantilla = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarPlantillaDTO }) =>
      plantillasApi.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLANTILLAS_QUERY_KEY });
    },
  });
};

export const useEliminarPlantilla = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plantillasApi.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLANTILLAS_QUERY_KEY });
    },
  });
};
