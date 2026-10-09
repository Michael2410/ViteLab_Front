export interface StockItem {
  id?: number;
  almacen_id: number;
  almacen_nombre: string;
  sede_id: number;
  sede_nombre: string;
  producto_id: number;
  producto_codigo?: string | null;
  producto_nombre: string;
  categoria_nombre?: string | null;
  unidad_medida_codigo?: string | null;
  stock_minimo: number;
  lote_id?: number;
  numero_lote?: string | null;
  marca?: string | null;
  fecha_vencimiento?: string | null;
  cantidad: number;
  total_lotes?: number;
  proximo_vencimiento?: string | null;
  ubicacion_id?: number | null;
  ubicacion_codigo?: string | null;
  ubicacion_nombre?: string | null;
  ubicaciones_str?: string | null;
}

export interface KardexItem {
  id: number;
  tipo: string;
  fecha: string;
  sede_id: number;
  sede_nombre?: string;
  almacen_id?: number | null;
  almacen_nombre?: string | null;
  personal_id?: number | null;
  personal_nombre?: string | null;
  producto_id: number;
  producto_codigo?: string | null;
  producto_nombre?: string;
  unidad_medida_codigo?: string | null;
  lote_id: number;
  numero_lote?: string | null;
  ubicacion_id?: number | null;
  ubicacion_codigo?: string | null;
  ubicacion_nombre?: string | null;
  cantidad: number;
  costo_unitario?: number | null;
  documento_tipo: string;
  documento_id: number;
  observacion?: string | null;
  usuario_nombre?: string;
}

export interface ListarStockParams {
  almacen_id?: number | number[];
  sede_id?: number;
  producto_id?: number;
  categoria_id?: number | number[];
  ubicacion_id?: number;
  search?: string;
  con_saldo?: boolean;
  desglosar_lote?: boolean;
  agrupar_por?: 'producto' | 'marca' | 'lote';
  page?: number;
  limit?: number;
}

export interface ListarKardexParams {
  almacen_id?: number | number[];
  producto_id?: number;
  lote_id?: number;
  ubicacion_id?: number;
  tipo?: string | string[];
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  limit?: number;
}
