// Interfaz para componente dentro del análisis
export interface ComponenteAnalisis {
  id: number;
  analisis_id: number;
  nombre: string;
  valor_referencial: string | null;
  unidad_medida: string | null;
  area_id: number | null;
  metodo_id: number | null;
  orden: number;
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
}

// Interfaz principal del análisis
export interface Analisis {
  id: number;
  nombre: string;
  descripcion: string | null;
  sinonimia: string[];
  componentes_ids: number[];
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones
  componentes?: ComponenteAnalisis[];
}

// Input para crear un análisis
export interface CreateAnalisisInput {
  nombre: string;
  descripcion?: string;
  sinonimia?: string[];
  componentes_ids?: number[];
}

// Input para actualizar un análisis
export interface UpdateAnalisisInput {
  nombre?: string;
  descripcion?: string;
  sinonimia?: string[];
  activo?: boolean;
  componentes_ids?: number[];
}

// Filtros para búsqueda y paginación
export interface AnalisisFilters {
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}

// Helper para convertir string de sinonimia a array
export const parseSinonimia = (value: string): string[] => {
  if (!value) return [];
  return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
};

// Helper para convertir array de sinonimia a string
export const formatSinonimia = (sinonimia: string[]): string => {
  return sinonimia.join(', ');
};
