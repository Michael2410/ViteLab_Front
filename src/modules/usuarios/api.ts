import apiClient from '../../shared/utils/apiClient';
import type { Usuario, CreateUsuarioInput, UpdateUsuarioInput, Rol } from './types';

// Obtener todos los usuarios
export const obtenerUsuarios = async (): Promise<Usuario[]> => {
  const { data } = await apiClient.get('/auth/users');
  return data.data;
};

// Obtener usuario por ID
export const obtenerUsuarioPorId = async (id: number): Promise<Usuario> => {
  const { data } = await apiClient.get(`/auth/users/${id}`);
  return data.data;
};

// Crear usuario
export const crearUsuario = async (usuario: CreateUsuarioInput): Promise<Usuario> => {
  const { data } = await apiClient.post('/auth/users', usuario);
  return data.data;
};

// Actualizar usuario
export const actualizarUsuario = async (id: number, usuario: UpdateUsuarioInput): Promise<Usuario> => {
  const { data } = await apiClient.put(`/auth/users/${id}`, usuario);
  return data.data;
};

// Eliminar usuario (soft delete)
export const eliminarUsuario = async (id: number): Promise<void> => {
  await apiClient.delete(`/auth/users/${id}`);
};

// Obtener todos los roles
export const obtenerRoles = async (): Promise<Rol[]> => {
  const { data } = await apiClient.get('/auth/roles');
  return data.data;
};
