// ============================================
// TYPES & CONSTANTS
// ============================================

export const EstadoOrden = {
  REGISTRADA: 'REGISTRADA',
  CON_RESULTADOS: 'CON_RESULTADOS',
  APROBADA: 'APROBADA',
} as const;

export type EstadoOrden = typeof EstadoOrden[keyof typeof EstadoOrden];

export type Sexo = 'M' | 'F';

// ============================================
// INTERFACES
// ============================================

export interface Paciente {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  sexo: Sexo;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiDniData {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento?: string;
}

export interface ApiDniResponse {
  success: boolean;
  message?: string;
  data?: ApiDniData;
}

export interface Sede {
  id: number;
  nombre: string;
  codigo: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
}

export interface TipoCliente {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface Convenio {
  id: number;
  nombre: string;
  tarifario_id: number;
  tarifario_nombre?: string;
  activo: boolean;
}

export interface Area {
  id: number;
  nombre: string;
  codigo: string;
  activo: boolean;
}

export interface Analisis {
  id: number;
  codigo: string;
  nombre: string;
  area_id: number;
  area_nombre?: string;
  metodo_id: number;
  metodo_nombre?: string;
  unidad_medida?: string;
  tiempo_entrega?: string;
  precio_base: number;
  activo: boolean;
}

export interface OrdenAnalisis {
  id: number;
  orden_id: number;
  analisis_id: number;
  precio: number;
  analisis?: Analisis;
}

export interface Orden {
  id: number;
  numero_atencion: number;
  paciente_id: number;
  sede_id: number;
  tipo_cliente_id: number;
  convenio_id?: number | null;
  estado: EstadoOrden;
  fecha_registro: string;
  fecha_aprobacion?: string | null;
  usuario_registro_id: number;
  usuario_aprobacion_id?: number | null;
  total?: number;
  nota?: string | null;
  created_at: string;
  updated_at: string;
  // Campos adicionales que vienen del backend
  paciente_dni?: string;
  paciente_nombres?: string;
  paciente_apellidos?: string;
  sede_nombre?: string;
  tipo_cliente_nombre?: string;
  convenio_nombre?: string;
}

export interface OrdenDetalle extends Orden {
  paciente: Paciente;
  sede: Sede;
  tipo_cliente: TipoCliente;
  convenio?: Convenio | null;
  usuario_registro?: {
    id: number;
    nombre: string;
    email: string;
  };
  usuario_resultados?: {
    id: number;
    nombre: string;
    email: string;
  } | null;
  usuario_aprobacion?: {
    id: number;
    nombre: string;
    email: string;
  } | null;
  analisis: OrdenAnalisis[];
}

// ============================================
// FORM INPUTS
// ============================================

export interface PacienteFormInput {
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  sexo: Sexo;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface CreateOrdenInput {
  paciente: PacienteFormInput;
  sede_id: number;
  tipo_cliente_id: number;
  convenio_id?: number;
  analisis_ids: number[];
  observaciones?: string;
}

export interface UpdateOrdenInput {
  sede_id?: number;
  tipo_cliente_id?: number;
  convenio_id?: number;
  observaciones?: string;
}

export interface UpdateEstadoOrdenInput {
  estado: EstadoOrden;
}

// ============================================
// FILTERS
// ============================================

export interface OrdenFilters {
  estado?: EstadoOrden;
  sede_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  paciente_dni?: string;
  numero_orden?: string;
  page?: number;
  limit?: number;
}

// ============================================
// BADGE CONFIGS
// ============================================

export const ESTADO_ORDEN_COLORS: Record<EstadoOrden, string> = {
  [EstadoOrden.REGISTRADA]: 'blue',
  [EstadoOrden.CON_RESULTADOS]: 'orange',
  [EstadoOrden.APROBADA]: 'green',
};

export const ESTADO_ORDEN_LABELS: Record<EstadoOrden, string> = {
  [EstadoOrden.REGISTRADA]: 'Registrada',
  [EstadoOrden.CON_RESULTADOS]: 'Con Resultados',
  [EstadoOrden.APROBADA]: 'Aprobada',
};

export const SEXO_LABELS: Record<Sexo, string> = {
  M: 'Masculino',
  F: 'Femenino',
};
