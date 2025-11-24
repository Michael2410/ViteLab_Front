// Interfaz principal del componente
export interface Componente {
  id: number;
  analisis_id?: number | null; // Ahora es opcional (componentes independientes)
  nombre: string;
  valor_referencial: string | null;
  unidad_medida: string | null;
  area_id: number | null;
  metodo_id: number | null;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones (ya no se usa analisis)
  area?: {
    id: number;
    nombre: string;
  };
  metodo?: {
    id: number;
    nombre: string;
  };
}

// Input para crear un componente (ya no requiere analisis_id)
export interface CreateComponenteInput {
  nombre: string;
  valor_referencial?: string;
  unidad_medida?: string;
  area_id?: number;
  metodo_id?: number;
  orden?: number;
}

// Input para actualizar un componente
export interface UpdateComponenteInput {
  nombre?: string;
  valor_referencial?: string;
  unidad_medida?: string;
  area_id?: number;
  metodo_id?: number;
  orden?: number;
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
