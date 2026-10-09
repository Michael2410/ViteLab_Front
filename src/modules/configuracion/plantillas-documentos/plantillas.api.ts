import apiClient from '../../../shared/utils/apiClient';
import type { ApiResponse } from '../../../shared/types/api.types';
import type {
  PlantillaDocumento,
  CrearPlantillaDTO,
  ActualizarPlantillaDTO,
} from './plantillas.types';

export const plantillasApi = {
  listar: async (): Promise<PlantillaDocumento[]> => {
    const res = await apiClient.get<ApiResponse<PlantillaDocumento[]>>('/personal/documentos/plantillas');
    return res.data.data;
  },

  obtener: async (id: number): Promise<PlantillaDocumento> => {
    const res = await apiClient.get<ApiResponse<PlantillaDocumento>>(`/personal/documentos/plantillas/${id}`);
    return res.data.data;
  },

  obtenerPorTipo: async (tipo: string): Promise<PlantillaDocumento> => {
    const res = await apiClient.get<ApiResponse<PlantillaDocumento>>(`/personal/documentos/plantillas/tipo/${tipo}`);
    return res.data.data;
  },

  crear: async (data: CrearPlantillaDTO): Promise<PlantillaDocumento> => {
    const res = await apiClient.post<ApiResponse<PlantillaDocumento>>('/personal/documentos/plantillas', data);
    return res.data.data;
  },

  actualizar: async (id: number, data: ActualizarPlantillaDTO): Promise<PlantillaDocumento> => {
    const res = await apiClient.put<ApiResponse<PlantillaDocumento>>(`/personal/documentos/plantillas/${id}`, data);
    return res.data.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/personal/documentos/plantillas/${id}`);
  },
};
