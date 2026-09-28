import { almacenApi } from '../shared/almacen.api';
import type { Paginado } from '../shared/types';
import type { Ajuste, ListarAjustesParams, CrearAjusteDTO } from './ajustes.types';

export const ajustesApi = {
  listar: (params: ListarAjustesParams) =>
    almacenApi.get<Paginado<Ajuste>>('/ajustes', params),

  obtener: (id: number) =>
    almacenApi.get<Ajuste>(`/ajustes/${id}`),

  crear: (data: CrearAjusteDTO) =>
    almacenApi.post<Ajuste>('/ajustes', data),

  aprobar: (id: number) =>
    almacenApi.post<Ajuste>(`/ajustes/${id}/aprobar`),

  rechazar: (id: number, motivo: string) =>
    almacenApi.post<Ajuste>(`/ajustes/${id}/rechazar`, { motivo }),
};
