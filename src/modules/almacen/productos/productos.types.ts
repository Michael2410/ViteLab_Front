export interface Producto {
  id: number;
  codigo?: string | null;
  nombre: string;
  descripcion?: string | null;
  categoria_id?: number | null;
  categoria_nombre?: string | null;
  unidad_medida_id: number;
  unidad_medida_nombre?: string | null;
  unidad_medida_codigo?: string | null;
  unidad_codigo?: string | null;
  unidad_nombre?: string | null;
  area_id?: number | null;
  stock_minimo: number;
  controla_lote: boolean;
  controla_vencimiento: boolean;
  requiere_cadena_frio: boolean;
  temp_min?: number | null;
  temp_max?: number | null;
  dias_alerta_vencimiento: number;
  activo: boolean;
  legacy_id?: string | null;
  usuario_registro_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ListarProductosParams {
  page?: number;
  limit?: number;
  search?: string;
  categoria_id?: number | number[];
  activo?: boolean;
}

export interface ProductoFormValues {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  categoria_id?: number;
  unidad_medida_id: number;
  stock_minimo?: number;
  controla_lote?: boolean;
  controla_vencimiento?: boolean;
  requiere_cadena_frio?: boolean;
  temp_min?: number;
  temp_max?: number;
  dias_alerta_vencimiento?: number;
  activo?: boolean;
}
