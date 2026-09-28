import { almacenApi } from '../shared/almacen.api';
import type { Paginado } from '../shared/types';
import type { Despacho, ListarDespachosParams, CrearDespachoDTO } from './despachos.types';

export const despachosApi = {
  listar: (params: ListarDespachosParams) =>
    almacenApi.get<Paginado<Despacho>>('/despachos', params),

  obtener: (id: number) =>
    almacenApi.get<Despacho>(`/despachos/${id}`),

  crear: (data: CrearDespachoDTO) =>
    almacenApi.post<Despacho>('/despachos', data),

  anular: (id: number, motivo: string) =>
    almacenApi.post<Despacho>(`/despachos/${id}/anular`, { motivo }),
};
