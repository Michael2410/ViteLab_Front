// Interfaz principal del convenio
export interface Convenio {
  id: number;
  nombre_empresa: string;
  ruc: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  tarifario_id: number | null;
  logo_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones
  tarifario?: {
    id: number;
    nombre: string;
  };
}

// Input para crear un convenio
export interface CreateConvenioInput {
  nombre_empresa: string;
  ruc: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  tarifario_id?: number;
  logo_url?: string;
}

// Input para actualizar un convenio
export interface UpdateConvenioInput {
  nombre_empresa?: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  tarifario_id?: number;
  logo_url?: string | null;
  activo?: boolean;
}

// Filtros para búsqueda y paginación
export interface ConvenioFilters {
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}
