// Interfaz principal del tarifario
export interface Tarifario {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Precio de análisis en tarifario
export interface TarifarioPrecio {
  id: number;
  tarifario_id: number;
  analisis_id: number;
  analisis_nombre?: string;
  precio: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Tarifario con sus precios
export interface TarifarioWithPrecios extends Tarifario {
  precios: TarifarioPrecio[];
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

// Input para crear precio
export interface CreateTarifarioPrecioInput {
  tarifario_id: number;
  analisis_id: number;
  precio: number;
}

// Input para actualizar precio
export interface UpdateTarifarioPrecioInput {
  precio: number;
}

// Filtros para búsqueda y paginación
export interface TarifarioFilters {
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}
