import { almacenApi } from '../shared/almacen.api';
import type { UnidadMedida, Categoria, Almacen, Ubicacion } from './maestros.types';

export const maestrosApi = {
  // UNIDADES
  listarUnidades: () => almacenApi.get<UnidadMedida[]>('/maestros/unidades-medida'),
  crearUnidad: (data: Partial<UnidadMedida>) =>
    almacenApi.post<UnidadMedida>('/maestros/unidades-medida', data),
  actualizarUnidad: (id: number, data: Partial<UnidadMedida>) =>
    almacenApi.put<UnidadMedida>(`/maestros/unidades-medida/${id}`, data),
  desactivarUnidad: (id: number) =>
    almacenApi.delete<UnidadMedida>(`/maestros/unidades-medida/${id}`),

  // CATEGORIAS
  listarCategorias: () => almacenApi.get<Categoria[]>('/maestros/categorias'),
  crearCategoria: (data: Partial<Categoria>) =>
    almacenApi.post<Categoria>('/maestros/categorias', data),
  actualizarCategoria: (id: number, data: Partial<Categoria>) =>
    almacenApi.put<Categoria>(`/maestros/categorias/${id}`, data),
  desactivarCategoria: (id: number) =>
    almacenApi.delete<Categoria>(`/maestros/categorias/${id}`),

  // ALMACENES
  listarAlmacenes: (params?: { sede_id?: number; activo?: boolean }) =>
    almacenApi.get<Almacen[]>('/maestros/almacenes', params),
  obtenerAlmacen: (id: number) =>
    almacenApi.get<Almacen>(`/maestros/almacenes/${id}`),
  crearAlmacen: (data: Partial<Almacen>) =>
    almacenApi.post<Almacen>('/maestros/almacenes', data),
  actualizarAlmacen: (id: number, data: Partial<Almacen>) =>
    almacenApi.put<Almacen>(`/maestros/almacenes/${id}`, data),
  desactivarAlmacen: (id: number) =>
    almacenApi.delete<Almacen>(`/maestros/almacenes/${id}`),

  // UBICACIONES
  listarUbicaciones: (params?: { almacen_id?: number; activo?: boolean }) =>
    almacenApi.get<Ubicacion[]>('/maestros/ubicaciones', params),
  crearUbicacion: (data: Partial<Ubicacion>) =>
    almacenApi.post<Ubicacion>('/maestros/ubicaciones', data),
  actualizarUbicacion: (id: number, data: Partial<Ubicacion>) =>
    almacenApi.put<Ubicacion>(`/maestros/ubicaciones/${id}`, data),
  desactivarUbicacion: (id: number) =>
    almacenApi.delete<Ubicacion>(`/maestros/ubicaciones/${id}`),
};
