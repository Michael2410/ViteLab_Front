import { almacenApi } from '../shared/almacen.api';
import type { Paginado } from '../shared/types';
import type { Ingreso, ListarIngresosParams, CrearIngresoDTO } from './ingresos.types';

export const ingresosApi = {
  listar: (params: ListarIngresosParams) =>
    almacenApi.get<Paginado<Ingreso>>('/ingresos', params),

  obtener: (id: number) =>
    almacenApi.get<Ingreso>(`/ingresos/${id}`),

  crear: (data: CrearIngresoDTO) =>
    almacenApi.post<Ingreso>('/ingresos', data),

  anular: (id: number, motivo: string) =>
    almacenApi.post<Ingreso>(`/ingresos/${id}/anular`, { motivo }),
};
