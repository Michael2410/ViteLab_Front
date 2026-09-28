export interface IngresoItemDetalle {
  id?: number;
  producto_id: number;
  producto_codigo?: string | null;
  producto_nombre?: string;
  unidad_medida_codigo?: string | null;
  numero_lote?: string | null;
  marca?: string | null;
  fecha_vencimiento?: string | null;
  fecha_fabricacion?: string | null;
  ubicacion_id?: number | null;
  ubicacion_codigo?: string | null;
  cantidad: number;
  costo_unitario: number;
}

export interface Ingreso {
  id: number;
  numero: string;
  correlativo?: string;
  total_items?: number;
  monto_total?: number | null;
  almacen_id: number;
  almacen_nombre?: string | null;
  sede_id?: number | null;
  sede_nombre?: string | null;
  proveedor_id?: number | null;
  proveedor_razon_social?: string | null;
  proveedor_ruc?: string | null;
  tipo_documento: string;
  serie_documento?: string | null;
  numero_documento?: string | null;
  fecha_documento?: string | null;
  fecha_ingreso: string;
  moneda: string;
  observaciones?: string | null;
  estado: 'REGISTRADO' | 'ANULADO';
  motivo_anulacion?: string | null;
  usuario_registro_nombre?: string | null;
  usuario_anulacion_nombre?: string | null;
  fecha_anulacion?: string | null;
  created_at: string;
  items?: IngresoItemDetalle[];
}

export interface ListarIngresosParams {
  almacen_id?: number;
  proveedor_id?: number;
  estado?: string;
  search?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  limit?: number;
}

export interface CrearIngresoDTO {
  almacen_id: number;
  proveedor_id?: number | null;
  tipo_documento: string;
  serie_documento?: string | null;
  numero_documento?: string | null;
  fecha_documento?: string | null;
  fecha_ingreso: string;
  moneda?: string;
  observaciones?: string | null;
  items: Array<{
    producto_id: number;
    numero_lote?: string | null;
    marca?: string | null;
    fecha_vencimiento?: string | null;
    fecha_fabricacion?: string | null;
    ubicacion_id?: number | null;
    cantidad: number;
    costo_unitario: number;
  }>;
}
