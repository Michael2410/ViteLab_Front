import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useAuthStore } from '../hooks';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requiredPermission,
  requiredPermissions = [],
  requireAll = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // SUPER_ADMIN siempre tiene acceso
  if (user?.rol_nombre === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  // Combinar permisos
  const allPermissions = requiredPermission 
    ? [requiredPermission, ...requiredPermissions] 
    : requiredPermissions;

  // Si no hay permisos requeridos, permitir acceso
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
    return (
      <Result
        status="403"
        title="Acceso Denegado"
        subTitle="No tienes permisos para acceder a esta página"
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            Volver
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
