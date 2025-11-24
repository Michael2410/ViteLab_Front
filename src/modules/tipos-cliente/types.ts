// Interfaz principal del tipo de cliente
export interface TipoCliente {
  id: number;
  nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Input para crear un tipo de cliente
export interface CreateTipoClienteInput {
  nombre: string;
}

// Input para actualizar un tipo de cliente
export interface UpdateTipoClienteInput {
  nombre?: string;
  activo?: boolean;
}

// Filtros para búsqueda y paginación
export interface TipoClienteFilters {
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}
