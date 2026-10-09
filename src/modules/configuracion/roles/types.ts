// Tipos para el módulo de roles y permisos

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  total_usuarios?: number;
  permisos: string[];
}

export interface Permiso {
  id: number;
  modulo: string;
  submodulo: string | null;
  accion: string;
  codigo: string;
  descripcion: string | null;
  created_at: string;
}

export interface PermisoAgrupado {
  modulo: string;
  submodulos: {
    nombre: string | null;
    permisos: Permiso[];
  }[];
}

export interface CreateRolInput {
  nombre: string;
  descripcion?: string;
  permisos: number[];
}

export interface UpdateRolInput {
  nombre?: string;
  descripcion?: string | null;
  permisos?: number[];
  activo?: boolean;
}

// Mapeo de nombres amigables para módulos
export const MODULO_NOMBRES: Record<string, string> = {
  'auth': 'Autenticación',
  'orders': 'Órdenes',
  'results': 'Resultados',
  'catalogs': 'Catálogos',
  'tariffs': 'Tarifarios',
  'settings': 'Configuración',
  'reports': 'Reportes',
  'dashboard': 'Dashboard',
  'personal': 'Personal / RRHH',
  'almacen': 'Almacén & Logística',
};

// Mapeo de nombres amigables para submódulos
export const SUBMODULO_NOMBRES: Record<string, string> = {
  'users': 'Usuarios',
  'roles': 'Roles',
  'directorio': 'Directorio de Personal',
  'cuenta': 'Cuenta de Sistema',
  'contratos': 'Contratos & Vencimientos',
  'vacaciones': 'Control de Vacaciones',
  'asistencia': 'Asistencia & Faltas',
  'documentos': 'Documentos & Certificados',
  'catalogos': 'Cargos y Áreas (Catálogos)',
  'historial': 'Historial Laboral',
  'general': 'Acceso General',
  'analysis': 'Análisis',
  'analisis': 'Ranking de Análisis',
  'components': 'Componentes',
  'areas': 'Áreas',
  'methods': 'Métodos',
  'convenios': 'Convenios',
  'sedes': 'Sedes',
  'tipos-cliente': 'Tipos de Cliente',
  'muestras': 'Muestras',
  'ordenes': 'Órdenes por Período',
  'ingresos': 'Ingresos por Sede',
  'productividad': 'Productividad del Personal',
  'cuadre_caja': 'Cuadre de Caja Diaria',
  'productos': 'Catálogo de Productos',
  'proveedores': 'Proveedores',
  'maestros': 'Maestros y Catálogos',
  'stock': 'Stock y Existencias',
  'kardex': 'Kardex de Movimientos',
  'despachos': 'Despachos',
  'custodia': 'Custodia de Personal',
  'consumos': 'Consumos y Devoluciones',
  'pedidos': 'Pedidos Internos',
  'transferencias': 'Transferencias entre Sedes',
  'ajustes': 'Ajustes e Inventario',
};

// Mapeo de nombres amigables para acciones
export const ACCION_NOMBRES: Record<string, string> = {
  'create': 'Crear',
  'read': 'Ver',
  'update': 'Editar',
  'delete': 'Eliminar',
  'approve': 'Aprobar',
  'print': 'Imprimir',
  'manage': 'Administrar Todo',
};
