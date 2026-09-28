import { almacenApi } from '../shared/almacen.api';
import type { Paginado } from '../shared/types';
import type { Proveedor, ListarProveedoresParams, ProveedorFormValues } from './proveedores.types';

export const proveedoresApi = {
  listar: (params: ListarProveedoresParams) =>
    almacenApi.get<Paginado<Proveedor>>('/proveedores', params),

  obtener: (id: number) =>
    almacenApi.get<Proveedor>(`/proveedores/${id}`),

  crear: (data: ProveedorFormValues) =>
    almacenApi.post<Proveedor>('/proveedores', data),

  actualizar: (id: number, data: Partial<ProveedorFormValues>) =>
    almacenApi.put<Proveedor>(`/proveedores/${id}`, data),

  desactivar: (id: number) =>
    almacenApi.delete<Proveedor>(`/proveedores/${id}`),
};
