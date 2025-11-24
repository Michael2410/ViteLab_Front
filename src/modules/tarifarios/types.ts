// Interfaz principal del tarifario
export interface Tarifario {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Input para crear un tarifario
export interface CreateTarifarioInput {
  nombre: string;
  descripcion?: string;
}

// Input para actualizar un tarifario
export interface UpdateTarifarioInput {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

// Filtros para búsqueda y paginación
export interface TarifarioFilters {
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}
