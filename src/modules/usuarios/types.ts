// Tipos para el módulo de usuarios

export interface SedeAsignada {
  id: number;
  nombre: string;
  codigo: string;
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  rol_id: number;
  rol_nombre: string;
  rol_descripcion: string;
  firma_url: string | null;
  sedes?: SedeAsignada[];
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUsuarioInput {
  username: string;
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  rol_id: number;
  firma_url?: string;
  sede_ids?: number[];
}

export interface UpdateUsuarioInput {
  email?: string;
  password?: string;
  nombres?: string;
  apellidos?: string;
  rol_id?: number;
  firma_url?: string | null;
  sede_ids?: number[];
  activo?: boolean;
}

export interface UsuarioFilters {
  search?: string;
  activo?: boolean;
  rol_id?: number;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}
