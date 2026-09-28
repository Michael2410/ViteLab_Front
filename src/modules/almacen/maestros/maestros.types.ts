export interface UnidadMedida {
  id: number;
  codigo: string;
  nombre: string;
  permite_decimales: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Almacen {
  id: number;
  sede_id: number;
  sede_nombre?: string | null;
  nombre: string;
  descripcion?: string | null;
  es_principal: boolean;
  responsable_usuario_id?: number | null;
  activo: boolean;
  legacy_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ubicacion {
  id: number;
  almacen_id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  temp_min?: number | null;
  temp_max?: number | null;
  activo: boolean;
  legacy_id?: string | null;
  created_at: string;
  updated_at: string;
}
