// ============================================
// INTERFACES
// ============================================

export interface Area {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// FORM INPUTS
// ============================================

export interface CreateAreaInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
}

export interface UpdateAreaInput {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

// ============================================
// FILTERS
// ============================================

export interface AreaFilters {
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}
