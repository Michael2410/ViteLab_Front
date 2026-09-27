// Interfaz principal de la sede
export interface Sede {
  id: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Input para crear una sede
export interface CreateSedeInput {
  nombre: string;
  direccion?: string;
  telefono?: string;
}

// Input para actualizar una sede
export interface UpdateSedeInput {
  nombre?: string;
  direccion?: string;
  telefono?: string;
  activo?: boolean;
}

// Filtros para búsqueda y paginación
export interface SedeFilters {
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}
