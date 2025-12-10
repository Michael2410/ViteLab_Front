import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  obtenerRoles,
} from './api';
import type { CreateUsuarioInput, UpdateUsuarioInput } from './types';

// Query keys
export const usuariosKeys = {
  all: ['usuarios'] as const,
  detail: (id: number) => ['usuarios', id] as const,
  roles: ['roles'] as const,
};

// Hook para obtener todos los usuarios
export const useUsuarios = () => {
  return useQuery({
    queryKey: usuariosKeys.all,
    queryFn: obtenerUsuarios,
    retry: false,
  });
};

// Hook para obtener un usuario por ID
export const useUsuario = (id: number) => {
  return useQuery({
    queryKey: usuariosKeys.detail(id),
    queryFn: () => obtenerUsuarioPorId(id),
    enabled: !!id,
  });
};

// Hook para crear usuario
export const useCrearUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (usuario: CreateUsuarioInput) => crearUsuario(usuario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
      message.success('Usuario creado exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al crear usuario');
    },
  });
};

// Hook para actualizar usuario
export const useActualizarUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUsuarioInput }) =>
      actualizarUsuario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
      message.success('Usuario actualizado exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al actualizar usuario');
    },
  });
};

// Hook para eliminar usuario
export const useEliminarUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => eliminarUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
      message.success('Usuario eliminado exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al eliminar usuario');
    },
  });
};

// Hook para obtener roles
export const useRoles = () => {
  return useQuery({
    queryKey: usuariosKeys.roles,
    queryFn: obtenerRoles,
  });
};
