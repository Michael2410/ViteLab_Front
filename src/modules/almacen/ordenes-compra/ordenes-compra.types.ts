export interface OrdenCompraItemDetalle {
  id?: number;
  orden_compra_id?: number;
  producto_id: number;
  producto_codigo?: string | null;
  producto_nombre?: string | null;
  unidad_medida_codigo?: string | null;
  unidad_medida_nombre?: string | null;
  cantidad_solicitada: number;
  cantidad_recibida: number;
  saldo_pendiente?: number;
  precio_unitario: number;
  subtotal: number;
  observaciones?: string | null;
}

export type EstadoOrdenCompra = 'PENDIENTE' | 'PARCIAL' | 'RECEPCIONADA' | 'ANULADA';

export interface OrdenCompra {
  id: number;
  numero: string;
  sede_id: number;
  sede_nombre?: string | null;
  proveedor_id: number;
  proveedor_razon_social?: string | null;
  proveedor_ruc?: string | null;
  proveedor_direccion?: string | null;
  proveedor_telefono?: string | null;
  proveedor_email?: string | null;
  proveedor_contacto?: string | null;
  almacen_destino_id?: number | null;
  almacen_destino_nombre?: string | null;
  fecha_emision: string;
  fecha_entrega_esperada?: string | null;
  moneda: string;
  condicion_pago: string;
  estado: EstadoOrdenCompra;
  subtotal: number;
  igv: number;
  total: number;
  observaciones?: string | null;
  motivo_anulacion?: string | null;
  usuario_registro_id: number;
  usuario_registro_nombre?: string | null;
  usuario_anulacion_id?: number | null;
  usuario_anulacion_nombre?: string | null;
  fecha_anulacion?: string | null;
  total_items?: number;
  created_at: string;
  updated_at: string;
  items?: OrdenCompraItemDetalle[];
  ingresos_relacionados?: Array<{
    id: number;
    numero: string;
    fecha_ingreso: string;
    tipo_documento: string;
    numero_documento?: string | null;
    estado: string;
  }>;
}

export interface ListarOrdenesCompraParams {
  sede_id?: number | number[] | null;
  proveedor_id?: number | number[] | null;
  almacen_destino_id?: number | number[] | null;
  estado?: string | string[];
  search?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  limit?: number;
}

export interface CrearOrdenCompraDTO {
  sede_id?: number | null;
  proveedor_id: number;
  almacen_destino_id?: number | null;
  fecha_emision: string;
  fecha_entrega_esperada?: string | null;
  moneda?: string;
  condicion_pago?: string;
  observaciones?: string | null;
  items: Array<{
    producto_id: number;
    cantidad_solicitada: number;
    precio_unitario: number;
    observaciones?: string | null;
  }>;
}
