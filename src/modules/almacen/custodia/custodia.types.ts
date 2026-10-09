export interface ItemCustodia {
  id: number;
  personal_id: number;
  almacen_origen_id: number;
  lote_id: number;
  cantidad: number;
  updated_at: string | null;
  // Joins
  personal_nombres: string;
  personal_apellidos: string;
  personal_documento: string | null;
  almacen_nombre: string;
  sede_id: number;
  producto_id: number;
  producto_codigo: string | null;
  producto_nombre: string;
  unidad_medida_codigo: string;
  unidad_medida_nombre: string;
  numero_lote: string | null;
  fecha_vencimiento: string | null;
  dias_para_vencer: number | null;
  estado_vencimiento: 'VIGENTE' | 'POR_VENCER' | 'VENCIDO' | 'SIN_VENCIMIENTO';
}

export interface CustodiaResumen {
  total_items: number;
  total_unidades: number;
  items_por_vencer: number;
  items_vencidos: number;
}

export interface ListarCustodiaParams {
  page?: number;
  limit?: number;
  personal_id?: number;
  almacen_id?: number;
  search?: string;
  solo_con_stock?: boolean;
}

export interface ConsumoItem {
  id: number;
  consumo_id: number;
  almacen_origen_id: number;
  producto_id: number;
  lote_id: number;
  cantidad: number;
  observacion: string | null;
  producto_codigo: string | null;
  producto_nombre: string;
  unidad_medida_codigo: string;
  numero_lote: string | null;
  marca?: string | null;
  fecha_vencimiento: string | null;
  almacen_nombre?: string;
}

export interface Consumo {
  id: number;
  numero: string;
  sede_id: number;
  sede_nombre?: string;
  personal_id: number;
  personal_documento?: string | null;
  area_id: number | null;
  area_nombre?: string | null;
  fecha: string;
  observaciones: string | null;
  estado: string;
  motivo_anulacion: string | null;
  usuario_registro_nombre?: string | null;
  usuario_anulacion_id?: number | null;
  fecha_anulacion?: string | null;
  personal_nombres?: string;
  personal_apellidos?: string;
  items?: ConsumoItem[];
}

export interface CrearConsumoDTO {
  sede_id: number;
  personal_id?: number;
  area_id?: number;
  fecha?: string;
  observaciones?: string;
  items: {
    almacen_origen_id: number;
    producto_id: number;
    lote_id: number;
    cantidad: number;
    observacion?: string;
  }[];
}

export interface DevolucionItem {
  id: number;
  devolucion_id: number;
  producto_id: number;
  lote_id: number;
  cantidad: number;
  observacion: string | null;
  producto_codigo: string | null;
  producto_nombre: string;
  unidad_medida_codigo: string;
  numero_lote: string | null;
  marca?: string | null;
  fecha_vencimiento?: string | null;
}

export interface Devolucion {
  id: number;
  numero: string;
  almacen_id: number;
  almacen_nombre?: string;
  sede_id?: number;
  personal_id: number;
  personal_documento?: string | null;
  fecha: string;
  observaciones: string | null;
  estado: string;
  motivo_anulacion: string | null;
  usuario_registro_nombre?: string | null;
  usuario_anulacion_id?: number | null;
  fecha_anulacion?: string | null;
  personal_nombres?: string;
  personal_apellidos?: string;
  items?: DevolucionItem[];
}

export interface CrearDevolucionDTO {
  almacen_id: number;
  personal_id?: number;
  fecha?: string;
  observaciones?: string;
  items: {
    producto_id: number;
    lote_id: number;
    cantidad: number;
    observacion?: string;
  }[];
}
