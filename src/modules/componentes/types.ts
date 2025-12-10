// Interfaz principal del componente
export interface Componente {
  id: number;
  nombre: string;
  valores_referenciales: string[];
  unidad_medida: string | null;
  area_id: number | null;
  metodo_id: number | null;
  valor_alerta_min: number | null;
  valor_alerta_max: number | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones
  area?: {
    id: number;
    nombre: string;
  };
  metodo?: {
    id: number;
    nombre: string;
  };
  muestras_ids?: number[];
  muestras?: Array<{
    id: number;
    nombre: string;
  }>;
}

// Input para crear un componente
export interface CreateComponenteInput {
  nombre: string;
  valores_referenciales?: string[];
  unidad_medida?: string;
  area_id?: number;
  metodo_id?: number;
  muestras_ids?: number[];
  valor_alerta_min?: number | null;
  valor_alerta_max?: number | null;
}

// Input para actualizar un componente
export interface UpdateComponenteInput {
  nombre?: string;
  valores_referenciales?: string[];
  unidad_medida?: string | null;
  area_id?: number | null;
  metodo_id?: number | null;
  muestras_ids?: number[];
  valor_alerta_min?: number | null;
  valor_alerta_max?: number | null;
  activo?: boolean;
}

// Filtros para búsqueda y paginación
export interface ComponenteFilters {
  search?: string;
  area_id?: number;
  metodo_id?: number;
  activo?: boolean;
  page?: number;
  limit?: number;
}
