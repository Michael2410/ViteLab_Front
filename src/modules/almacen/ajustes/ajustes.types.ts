export interface ItemAjusteDetalle {
  id: number;
  ajuste_id: number;
  producto_id: number;
  lote_id: number;
  cantidad: number;
  sentido: 'ENTRADA' | 'SALIDA';
  costo_unitario: number | null;
  observacion: string | null;
  producto_codigo: string | null;
  producto_nombre: string;
  unidad_medida_codigo: string;
  unidad_medida_nombre: string;
  numero_lote: string | null;
  fecha_vencimiento: string | null;
}

export interface Ajuste {
  id: number;
  numero: string;
  almacen_id: number;
  tipo: 'CONTEO_FISICO' | 'MERMA' | 'BAJA' | 'REGULARIZACION';
  motivo: string | null;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  usuario_registro_id: number;
  usuario_aprobacion_id: number | null;
  fecha_aprobacion: string | null;
  motivo_rechazo: string | null;
  observaciones: string | null;
  created_at: string | null;
  updated_at: string | null;
  almacen_nombre: string;
  sede_id: number;
  sede_nombre?: string;
  usuario_registro_nombre?: string | null;
  usuario_aprobacion_nombre?: string | null;
  items?: ItemAjusteDetalle[];
}

export interface ListarAjustesParams {
  page?: number;
  limit?: number;
  almacen_id?: number;
  tipo?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
}

export interface CrearAjusteDTO {
  almacen_id: number;
  tipo: 'CONTEO_FISICO' | 'MERMA' | 'BAJA' | 'REGULARIZACION';
  motivo?: string;
  observaciones?: string;
  items: {
    producto_id: number;
    lote_id: number;
    cantidad: number;
    sentido: 'ENTRADA' | 'SALIDA';
    costo_unitario?: number;
    observacion?: string;
  }[];
}
