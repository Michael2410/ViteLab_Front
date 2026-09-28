import { almacenApi } from '../shared/almacen.api';
import type { Paginado } from '../shared/types';
import type { Pedido, ListarPedidosParams, CrearPedidoDTO } from './pedidos.types';

export const pedidosApi = {
  listar: (params: ListarPedidosParams) =>
    almacenApi.get<Paginado<Pedido>>('/pedidos', params),

  obtener: (id: number) =>
    almacenApi.get<Pedido>(`/pedidos/${id}`),

  crear: (data: CrearPedidoDTO) =>
    almacenApi.post<Pedido>('/pedidos', data),

  aprobar: (id: number, items?: { detalle_id: number; cantidad_aprobada: number }[]) =>
    almacenApi.post<Pedido>(`/pedidos/${id}/aprobar`, { items }),

  rechazar: (id: number, motivo: string) =>
    almacenApi.post<Pedido>(`/pedidos/${id}/rechazar`, { motivo }),

  anular: (id: number, motivo: string) =>
    almacenApi.post<Pedido>(`/pedidos/${id}/anular`, { motivo }),
};
