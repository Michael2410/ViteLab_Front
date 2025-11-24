// Interfaz principal del método
export interface Metodo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Input para crear un método
export interface CreateMetodoInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
}

// Input para actualizar un método
export interface UpdateMetodoInput {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

// Filtros para búsqueda y paginación
export interface MetodoFilters {
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}
