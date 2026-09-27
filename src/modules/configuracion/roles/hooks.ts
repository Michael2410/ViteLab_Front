import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  obtenerRoles,
  obtenerRolesActivos,
  obtenerRolPorId,
  crearRol,
  actualizarRol,
  eliminarRol,
  obtenerPermisos,
  obtenerPermisosAgrupados,
  obtenerPermisosRol,
} from './api';
import type { CreateRolInput, UpdateRolInput } from './types';

// Keys para React Query
export const rolesKeys = {
  all: ['roles'] as const,
  lists: () => [...rolesKeys.all, 'list'] as const,
  list: () => [...rolesKeys.lists()] as const,
  active: () => [...rolesKeys.all, 'active'] as const,
  details: () => [...rolesKeys.all, 'detail'] as const,
  detail: (id: number) => [...rolesKeys.details(), id] as const,
  permisos: () => [...rolesKeys.all, 'permisos'] as const,
  permisosAgrupados: () => [...rolesKeys.all, 'permisosAgrupados'] as const,
  permisosRol: (id: number) => [...rolesKeys.all, 'permisosRol', id] as const,
};

// ============================================
// QUERIES
// ============================================

// Hook para obtener todos los roles
export const useRoles = () => {
  return useQuery({
    queryKey: rolesKeys.list(),
    queryFn: obtenerRoles,
  });
};

// Hook para obtener roles activos
export const useRolesActivos = () => {
  return useQuery({
    queryKey: rolesKeys.active(),
    queryFn: obtenerRolesActivos,
  });
};

// Hook para obtener un rol por ID
export const useRol = (id: number) => {
  return useQuery({
    queryKey: rolesKeys.detail(id),
    queryFn: () => obtenerRolPorId(id),
    enabled: id > 0,
  });
};

// Hook para obtener todos los permisos
export const usePermisos = () => {
  return useQuery({
    queryKey: rolesKeys.permisos(),
    queryFn: obtenerPermisos,
  });
};

// Hook para obtener permisos agrupados
export const usePermisosAgrupados = () => {
  return useQuery({
    queryKey: rolesKeys.permisosAgrupados(),
    queryFn: obtenerPermisosAgrupados,
  });
};

// Hook para obtener permisos de un rol
export const usePermisosRol = (rolId: number) => {
  return useQuery({
    queryKey: rolesKeys.permisosRol(rolId),
    queryFn: () => obtenerPermisosRol(rolId),
    enabled: rolId > 0,
  });
};

// ============================================
// MUTATIONS
// ============================================

// Hook para crear rol
export const useCrearRol = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRolInput) => crearRol(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rolesKeys.active() });
    },
  });
};

// Hook para actualizar rol
export const useActualizarRol = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRolInput }) => actualizarRol(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rolesKeys.active() });
      queryClient.invalidateQueries({ queryKey: rolesKeys.detail(variables.id) });
    },
  });
};

// Hook para eliminar rol
export const useEliminarRol = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => eliminarRol(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rolesKeys.active() });
    },
  });
};
