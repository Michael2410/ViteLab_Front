// ============================================
// TYPES & CONSTANTS
// ============================================

export const EstadoOrden = {
  REGISTRADA: 'REGISTRADA',
  MUESTRA_RECIBIDA: 'MUESTRA_RECIBIDA',
  CON_RESULTADOS: 'CON_RESULTADOS',
  APROBADA: 'APROBADA',
  IMPRESO: 'IMPRESO',
} as const;

export type EstadoOrden = typeof EstadoOrden[keyof typeof EstadoOrden];

export const TipoPaciente = {
  PARTICULAR: 'PARTICULAR',
  CONVENIO: 'CONVENIO',
} as const;

export type TipoPaciente = typeof TipoPaciente[keyof typeof TipoPaciente];

export type Genero = 'M' | 'F';

// ============================================
// INTERFACES
// ============================================

export interface Paciente {
  id: number;
  dni: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombre_completo: string;
  fecha_nacimiento: string;
  genero: Genero;
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
  nombre_empresa: string;
  ruc?: string;
  tarifario_id?: number;
  tarifario?: {
    id: number;
    nombre: string;
  };
  activo: boolean;
}

export interface Area {
  id: number;
  nombre: string;
  codigo: string;
  activo: boolean;
}

export interface MuestraSimple {
  id: number;
  nombre: string;
}

export interface ComponenteConMuestras {
  id: number;
  nombre: string;
  unidad_medida?: string;
  valores_referenciales?: string[];
  muestras: MuestraSimple[];
}

export interface Analisis {
  id: number;
  nombre: string;
  descripcion?: string;
  sinonimia?: string[];
  componentes_ids?: number[];
  componentes?: ComponenteConMuestras[];
  activo: boolean;
}

export interface Muestra {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface OrdenAnalisis {
  id: number;
  orden_id?: number;
  analisis_id: number;
  nombre?: string;
  muestras_ids?: number[];
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
  muestra_recepcionada: boolean;
  tipo_paciente?: TipoPaciente | null;
  fecha_registro: string;
  fecha_recepcion?: string | null;
  fecha_aprobacion?: string | null;
  usuario_registro_id: number;
  usuario_recepcion_id?: number | null;
  usuario_aprobacion_id?: number | null;
  total?: number;
  nota?: string | null;
  medico?: string | null;
  created_at: string;
  updated_at: string;
  // Campos adicionales que vienen del backend
  paciente_dni?: string;
  paciente_nombres?: string;
  paciente_apellidos?: string;
  sede_nombre?: string;
  tipo_cliente_nombre?: string;
  convenio_nombre?: string;
  usuario_recepcion_nombre?: string | null;
}

export interface OrdenDetalle extends Orden {
  paciente: Paciente;
  sede: Sede;
  tipo_cliente: TipoCliente;
  convenio?: Convenio | null;
  usuario_registro?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
  usuario_recepcion?: {
    id: number;
    nombres: string;
    apellidos: string;
  } | null;
  usuario_resultados?: {
    id: number;
    nombres: string;
    apellidos: string;
  } | null;
  usuario_aprobacion?: {
    id: number;
    nombres: string;
    apellidos: string;
  } | null;
  analisis: OrdenAnalisis[];
}

// ============================================
// FORM INPUTS
// ============================================

export interface PacienteFormInput {
  dni: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento: string;
  genero: Genero;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface AnalisisSeleccionado {
  id: number;
  muestras_ids?: number[];
}

export interface CreateOrdenInput {
  paciente: PacienteFormInput;
  sede_id: number;
  tipo_cliente_id: number;
  convenio_id?: number;
  analisis: AnalisisSeleccionado[];
  nota?: string;
  medico?: string;
}

export interface UpdateOrdenInput {
  sede_id?: number;
  tipo_cliente_id?: number;
  convenio_id?: number;
  nota?: string;
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
  paciente_nombre?: string;
  page?: number;
  limit?: number;
}

// ============================================
// BADGE CONFIGS
// ============================================

export const ESTADO_ORDEN_COLORS: Record<EstadoOrden, string> = {
  [EstadoOrden.REGISTRADA]: 'blue',
  [EstadoOrden.MUESTRA_RECIBIDA]: 'cyan',
  [EstadoOrden.CON_RESULTADOS]: 'orange',
  [EstadoOrden.APROBADA]: 'green',
  [EstadoOrden.IMPRESO]: 'default',
};

export const ESTADO_ORDEN_LABELS: Record<EstadoOrden, string> = {
  [EstadoOrden.REGISTRADA]: 'Registrada',
  [EstadoOrden.MUESTRA_RECIBIDA]: 'Muestra Recibida',
  [EstadoOrden.CON_RESULTADOS]: 'Con Resultados',
  [EstadoOrden.APROBADA]: 'Aprobada',
  [EstadoOrden.IMPRESO]: 'Impreso',
};

export const SEXO_LABELS: Record<Genero, string> = {
  M: 'Masculino',
  F: 'Femenino',
};

// ============================================
// ALERTAS
// ============================================

export interface OrdenAprobadaDetalle {
  id: number;
  numero_atencion: number;
  paciente_nombre: string;
  fecha_aprobacion: string;
}

export interface AlertasCounts {
  ordenesAprobadas: number;
  ordenesPendientesAprobar: number;
  ordenesAprobadasDetalle: OrdenAprobadaDetalle[];
}
