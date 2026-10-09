import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../../shared/components/PermissionGuard';

export default function AlmacenIndexRedirect() {
  const { hasPermission, isSuperAdmin } = usePermissions();

  if (isSuperAdmin || hasPermission('almacen.productos.read')) {
    return <Navigate to="/almacen/productos" replace />;
  }
  if (hasPermission('almacen.stock.read')) {
    return <Navigate to="/almacen/stock" replace />;
  }
  if (hasPermission('almacen.ordenes_compra.read')) {
    return <Navigate to="/almacen/ordenes-compra" replace />;
  }
  if (hasPermission('almacen.ingresos.read')) {
    return <Navigate to="/almacen/ingresos" replace />;
  }
  if (hasPermission('almacen.despachos.read')) {
    return <Navigate to="/almacen/despachos" replace />;
  }
  if (hasPermission('almacen.custodia.read')) {
    return <Navigate to="/almacen/custodia" replace />;
  }
  if (hasPermission('almacen.pedidos.read')) {
    return <Navigate to="/almacen/pedidos" replace />;
  }
  if (hasPermission('almacen.transferencias.read')) {
    return <Navigate to="/almacen/transferencias" replace />;
  }
  if (hasPermission('almacen.ajustes.read')) {
    return <Navigate to="/almacen/ajustes" replace />;
  }
  if (hasPermission('almacen.proveedores.read')) {
    return <Navigate to="/almacen/proveedores" replace />;
  }
  if (hasPermission('almacen.maestros.read')) {
    return <Navigate to="/almacen/maestros" replace />;
  }

  return <Navigate to="/portal" replace />;
}
