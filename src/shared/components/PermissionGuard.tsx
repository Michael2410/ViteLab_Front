import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../modules/auth/hooks';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean; // true = requiere TODOS, false = requiere AL MENOS UNO
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Componente para proteger rutas/componentes basado en permisos
 * 
 * Uso:
 * - Un permiso: <PermissionGuard permission="orders.create">...</PermissionGuard>
 * - Varios (al menos uno): <PermissionGuard permissions={['orders.read', 'orders.create']} requireAll={false}>...</PermissionGuard>
 * - Varios (todos): <PermissionGuard permissions={['orders.read', 'orders.update']} requireAll>...</PermissionGuard>
 */
export function PermissionGuard({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  redirectTo,
}: PermissionGuardProps) {
  const { hasPermission, user } = useAuthStore();

  // Si no hay usuario, no mostrar nada
  if (!user) {
    return redirectTo ? <Navigate to={redirectTo} replace /> : <>{fallback}</>;
  }

  // Si el usuario es SUPER_ADMIN, siempre tiene acceso
  if (user.rol_nombre === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  // Combinar permisos
  const allPermissions = permission ? [permission, ...permissions] : permissions;

  if (allPermissions.length === 0) {
    return <>{children}</>;
  }

  // Verificar permisos
  let hasAccess: boolean;
  if (requireAll) {
    hasAccess = allPermissions.every((p) => hasPermission(p));
  } else {
    hasAccess = allPermissions.some((p) => hasPermission(p));
  }

  if (!hasAccess) {
    return redirectTo ? <Navigate to={redirectTo} replace /> : <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook para verificar permisos programáticamente
 */
export function usePermissions() {
  const { hasPermission, user } = useAuthStore();

  const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.rol_nombre === 'SUPER_ADMIN') return true;
    return hasPermission(permission);
  };

  const checkAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.rol_nombre === 'SUPER_ADMIN') return true;
    return permissions.some((p) => hasPermission(p));
  };

  const checkAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.rol_nombre === 'SUPER_ADMIN') return true;
    return permissions.every((p) => hasPermission(p));
  };

  return {
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    isSuperAdmin: user?.rol_nombre === 'SUPER_ADMIN',
    isAdmin: user?.rol_nombre === 'ADMIN' || user?.rol_nombre === 'SUPER_ADMIN',
  };
}
