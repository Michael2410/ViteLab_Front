export interface Muestra {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMuestraInput {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface UpdateMuestraInput {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}
