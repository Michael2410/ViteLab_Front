// Layout
export { ConfiguracionLayout, default as DefaultConfiguracionLayout } from './shared/ConfiguracionLayout';

// Sistema
export * from './sistema/pages/SistemaPage';
export * from './sistema/hooks';
export * from './sistema/types';
export * from './sistema/api';

// Sedes
export * from './sedes/pages/SedesPage';
export * from './sedes/hooks';
export * from './sedes/types';
export * from './sedes/api';

// Roles y Permisos
export * from './roles/pages/RolesPage';
export * from './roles/hooks';
export * from './roles/types';
export * from './roles/api';

// Usuarios
export * from './usuarios/pages/UsuariosPage';
export {
  useUsuarios,
  useUsuario,
  useCrearUsuario,
  useActualizarUsuario,
  useEliminarUsuario,
} from './usuarios/hooks';
export type {
  Usuario,
  CreateUsuarioInput,
  UpdateUsuarioInput,
  UsuarioFilters,
  SedeAsignada,
} from './usuarios/types';
export {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from './usuarios/api';

// Plantillas de Documentos (RRHH)
export * from './plantillas-documentos';
