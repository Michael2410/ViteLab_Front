import { almacenApi } from '../shared/almacen.api';
import type { Paginado } from '../shared/types';
import type {
  OrdenCompra,
  ListarOrdenesCompraParams,
  CrearOrdenCompraDTO,
} from './ordenes-compra.types';

export const ordenesCompraApi = {
  listar: (params: ListarOrdenesCompraParams) =>
    almacenApi.get<Paginado<OrdenCompra>>('/ordenes-compra', params),

  obtener: (id: number) =>
    almacenApi.get<OrdenCompra>(`/ordenes-compra/${id}`),

  crear: (data: CrearOrdenCompraDTO) =>
    almacenApi.post<OrdenCompra>('/ordenes-compra', data),

  anular: (id: number, motivo: string) =>
    almacenApi.post<void>(`/ordenes-compra/${id}/anular`, { motivo }),
};
