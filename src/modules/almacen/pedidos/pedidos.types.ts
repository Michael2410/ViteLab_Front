export interface ItemPedidoDetalle {
  id: number;
  pedido_id: number;
  producto_id: number;
  cantidad_solicitada: number;
  cantidad_aprobada: number | null;
  cantidad_atendida: number;
  observacion: string | null;
  producto_codigo: string | null;
  producto_nombre: string;
  unidad_medida_codigo: string;
  unidad_medida_nombre: string;
  stock_disponible_almacen?: number | string;
}

export interface Pedido {
  id: number;
  numero: string;
  almacen_id: number;
  solicitante_personal_id: number;
  area_id?: number | null;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'ATENDIDO_PARCIAL' | 'ATENDIDO_TOTAL' | 'ANULADO';
  observaciones?: string | null;
  motivo_rechazo?: string | null;
  motivo_anulacion?: string | null;
  usuario_registro_id: number;
  usuario_aprobacion_id?: number | null;
  fecha_aprobacion?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  almacen_nombre?: string;
  sede_id: number;
  solicitante_nombres?: string;
  solicitante_apellidos?: string;
  solicitante_documento?: string | null;
  area_nombre?: string | null;
  usuario_registro_nombre?: string | null;
  items?: ItemPedidoDetalle[];
}

export interface ListarPedidosParams {
  page?: number;
  limit?: number;
  almacen_id?: number;
  solicitante_personal_id?: number;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
}

export interface CrearPedidoDTO {
  almacen_id: number;
  solicitante_personal_id?: number;
  area_id?: number;
  observaciones?: string;
  items: {
    producto_id: number;
    cantidad_solicitada: number;
    observacion?: string;
  }[];
}
