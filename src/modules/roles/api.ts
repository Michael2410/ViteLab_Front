import apiClient from '../../shared/utils/apiClient';
import type { Rol, Permiso, PermisoAgrupado, CreateRolInput, UpdateRolInput } from './types';

// ============================================
// ROLES
// ============================================

// Obtener todos los roles
export const obtenerRoles = async (): Promise<Rol[]> => {
  const { data } = await apiClient.get('/roles');
  return data.data;
};

// Obtener roles activos
export const obtenerRolesActivos = async (): Promise<Rol[]> => {
  const { data } = await apiClient.get('/roles/active');
  return data.data;
};

// Obtener rol por ID
export const obtenerRolPorId = async (id: number): Promise<Rol> => {
  const { data } = await apiClient.get(`/roles/${id}`);
  return data.data;
};

// Crear rol
export const crearRol = async (rol: CreateRolInput): Promise<Rol> => {
  const { data } = await apiClient.post('/roles', rol);
  return data.data;
};

// Actualizar rol
export const actualizarRol = async (id: number, rol: UpdateRolInput): Promise<Rol> => {
  const { data } = await apiClient.put(`/roles/${id}`, rol);
  return data.data;
};

// Eliminar rol
export const eliminarRol = async (id: number): Promise<void> => {
  await apiClient.delete(`/roles/${id}`);
};

// ============================================
// PERMISOS
// ============================================

// Obtener todos los permisos
export const obtenerPermisos = async (): Promise<Permiso[]> => {
  const { data } = await apiClient.get('/roles/permisos');
  return data.data;
};

// Obtener permisos agrupados
export const obtenerPermisosAgrupados = async (): Promise<PermisoAgrupado[]> => {
  const { data } = await apiClient.get('/roles/permisos/agrupados');
  return data.data;
};

// Obtener permisos de un rol (IDs)
export const obtenerPermisosRol = async (rolId: number): Promise<number[]> => {
  const { data } = await apiClient.get(`/roles/${rolId}/permisos`);
  return data.data;
};
