import { almacenApi } from '../shared/almacen.api';
import type { Paginado } from '../shared/types';
import type { Producto, ListarProductosParams, ProductoFormValues } from './productos.types';

export const productosApi = {
  listar: (params: ListarProductosParams) =>
    almacenApi.get<Paginado<Producto>>('/productos', params),

  obtener: (id: number) =>
    almacenApi.get<Producto>(`/productos/${id}`),

  crear: (data: ProductoFormValues) =>
    almacenApi.post<Producto>('/productos', data),

  actualizar: (id: number, data: Partial<ProductoFormValues>) =>
    almacenApi.put<Producto>(`/productos/${id}`, data),

  desactivar: (id: number) =>
    almacenApi.delete<Producto>(`/productos/${id}`),
};
