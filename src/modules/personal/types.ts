export interface PersonalSede {
  id: number;
  nombre: string;
}

export interface PersonalUsuarioInfo {
  id: number;
  username: string;
  email: string;
  rol_id: number;
  rol_nombre: string;
  activo: boolean;
}

export interface PersonalCatalogoItem {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  total_colaboradores?: number;
  total_personal?: number;
}

export type CatalogoTipo = 'cargos' | 'areas' | 'tipos-contrato' | 'motivos-cese';

export interface Personal {
  id: number;
  tipo_documento: string;
  numero_documento: string | null;
  nombres: string;
  apellidos: string;
  cargo: string | null;
  cargo_id?: number | null;
  area: string | null;
  area_id?: number | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  fecha_nacimiento: string | null;
  fecha_ingreso: string | null;
  tipo_contrato: string | null;
  tipo_contrato_id?: number | null;
  sueldo_base: number | null;
  colegiatura: string | null;
  firma_url: string | null;
  activo: boolean;
  fecha_cese?: string | null;
  motivo_cese?: string | null;
  motivo_cese_id?: number | null;
  observaciones_cese?: string | null;
  created_at: string;
  updated_at: string;
  sedes?: PersonalSede[];
  usuario?: PersonalUsuarioInfo | null;
}

export interface CreatePersonalInput {
  tipo_documento?: string;
  numero_documento?: string | null;
  nombres: string;
  apellidos: string;
  cargo?: string | null;
  cargo_id?: number | null;
  area?: string | null;
  area_id?: number | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  fecha_nacimiento?: string | null;
  fecha_ingreso?: string | null;
  tipo_contrato?: string | null;
  tipo_contrato_id?: number | null;
  sueldo_base?: number | null;
  colegiatura?: string | null;
  firma_url?: string | null;
  sede_ids?: number[];
  crear_usuario?: boolean;
  usuario_data?: {
    username: string;
    email: string;
    password: string;
    rol_id: number;
  };
}

export interface UpdatePersonalInput {
  tipo_documento?: string;
  numero_documento?: string | null;
  nombres?: string;
  apellidos?: string;
  cargo?: string | null;
  cargo_id?: number | null;
  area?: string | null;
  area_id?: number | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  fecha_nacimiento?: string | null;
  fecha_ingreso?: string | null;
  tipo_contrato?: string | null;
  tipo_contrato_id?: number | null;
  sueldo_base?: number | null;
  colegiatura?: string | null;
  firma_url?: string | null;
  activo?: boolean;
  fecha_cese?: string | null;
  motivo_cese?: string | null;
  observaciones_cese?: string | null;
  motivo_cese_id?: number | null;
  sede_ids?: number[];
}

export interface VincularCuentaInput {
  username: string;
  email: string;
  password: string;
  rol_id: number;
}

export interface DarDeBajaPersonalInput {
  fecha_cese: string;
  motivo_cese?: string;
  motivo_cese_id?: number | null;
  observaciones_cese?: string | null;
}

export interface UpdateCuentaInput {
  activo?: boolean;
  rol_id?: number;
  password?: string;
  email?: string;
}

export interface PersonalFilters {
  search?: string;
  cargo?: string | string[];
  cargo_id?: number | number[];
  area?: string | string[];
  area_id?: number | number[];
  tipo_contrato_id?: number | number[];
  activo?: boolean;
  sede_id?: number | number[];
  con_usuario?: boolean;
}

// ============================================
// HISTORIAL LABORAL (LOG AUDITORÍA)
// ============================================
export type TipoEventoLaboral =
  | 'ALTA_INICIAL'
  | 'CESE'
  | 'REINGRESO'
  | 'CAMBIO_CARGO'
  | 'CAMBIO_SUELDO'
  | 'CAMBIO_CONTRATO'
  | 'OTRO';

export interface HistorialLaboralItem {
  id: number;
  personal_id: number;
  tipo_evento: TipoEventoLaboral;
  fecha_evento: string;
  cargo?: string | null;
  area?: string | null;
  tipo_contrato?: string | null;
  sueldo_base?: number | null;
  motivo_cese_id?: number | null;
  motivo_cese_texto?: string | null;
  observaciones?: string | null;
  usuario_id?: number | null;
  usuario_nombre?: string | null;
  created_at: string;
}

// ============================================
// CONTRATOS & ALERTAS DE VENCIMIENTO
// ============================================
export type EstadoContrato = 'VIGENTE' | 'POR_VENCER' | 'VENCIDO' | 'RENOVADO' | 'CANCELADO';

export interface ContratoItem {
  id: number;
  personal_id: number;
  colaborador_nombre?: string;
  colaborador_documento?: string;
  colaborador_activo?: boolean;
  tipo_contrato_id?: number | null;
  tipo_contrato_nombre?: string | null;
  numero_contrato?: string | null;
  fecha_inicio: string;
  fecha_fin?: string | null;
  es_indefinido: boolean;
  cargo?: string | null;
  sueldo_pactado?: number | null;
  archivo_url?: string | null;
  estado: EstadoContrato;
  dias_restantes?: number | null;
  observaciones?: string | null;
  usuario_registro_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateContratoInput {
  personal_id: number;
  tipo_contrato_id?: number | null;
  tipo_contrato_nombre?: string | null;
  numero_contrato?: string | null;
  fecha_inicio: string;
  fecha_fin?: string | null;
  es_indefinido?: boolean;
  cargo?: string | null;
  sueldo_pactado?: number | null;
  archivo_url?: string | null;
  estado?: EstadoContrato;
  observaciones?: string | null;
}

export interface UpdateContratoInput {
  tipo_contrato_id?: number | null;
  tipo_contrato_nombre?: string | null;
  numero_contrato?: string | null;
  fecha_inicio?: string;
  fecha_fin?: string | null;
  es_indefinido?: boolean;
  cargo?: string | null;
  sueldo_pactado?: number | null;
  archivo_url?: string | null;
  estado?: EstadoContrato;
  observaciones?: string | null;
}

export interface ContratoFilters {
  personal_id?: number;
  estado?: EstadoContrato;
  por_vencer?: boolean;
  search?: string;
}

// ============================================
// CONTROL DE VACACIONES
// ============================================
export type EstadoVacacion = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'TOMADA' | 'CANCELADA';

export interface SolicitudVacacion {
  id: number;
  personal_id: number;
  colaborador_nombre?: string;
  colaborador_cargo?: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_solicitados: number;
  estado: EstadoVacacion;
  motivo?: string | null;
  observaciones_aprobador?: string | null;
  aprobado_por_nombre?: string | null;
  fecha_aprobacion?: string | null;
  created_at: string;
}

export interface SaldoVacacionalColaborador {
  personal_id: number;
  colaborador_nombre: string;
  cargo: string;
  area: string;
  fecha_ingreso: string;
  anios_servicio: number;
  dias_generados: number;
  dias_gozados: number;
  dias_pendientes: number;
  dias_por_vencer: number;
}

export interface CreateSolicitudVacacionInput {
  personal_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  dias_solicitados: number;
  motivo?: string;
}

// ============================================
// ASISTENCIA & FALTAS
// ============================================
export type EstadoAsistencia =
  | 'PRESENTE'
  | 'TARDANZA'
  | 'FALTA_JUSTIFICADA'
  | 'FALTA_INJUSTIFICADA'
  | 'PERMISO_MEDICO'
  | 'VACACIONES';

export interface RegistroAsistencia {
  id: number;
  personal_id: number;
  colaborador_nombre: string;
  colaborador_documento?: string;
  cargo: string;
  area: string;
  fecha: string;
  hora_entrada?: string | null;
  hora_salida?: string | null;
  minutos_tardanza: number;
  estado: EstadoAsistencia;
  justificacion?: string | null;
  sede_nombre?: string | null;
  created_at: string;
}

export interface FiltrosAsistencia {
  fecha?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  personal_id?: number;
  estado?: EstadoAsistencia | EstadoAsistencia[] | string | string[];
  search?: string;
}

export interface RegistrarAsistenciaInput {
  personal_id: number;
  fecha: string;
  hora_entrada?: string | null;
  hora_salida?: string | null;
  minutos_tardanza?: number;
  estado: EstadoAsistencia;
  justificacion?: string | null;
  sede_id?: number | null;
}

// ============================================
// DOCUMENTOS & CONSTANCIAS LABORALES
// ============================================
export type TipoDocumentoLaboral =
  | 'CONSTANCIA_TRABAJO'
  | 'CERTIFICADO_LABORAL'
  | 'CARTA_PRESENTACION'
  | 'BOLETA_PAGO';

export interface DocumentoLaboralItem {
  id: number;
  personal_id: number;
  colaborador_nombre: string;
  colaborador_documento: string;
  tipo_documento: TipoDocumentoLaboral;
  codigo_emision: string;
  fecha_emision: string;
  destinatario?: string | null;
  cargo_consignado: string;
  remuneracion_consignada?: number | null;
  archivo_url?: string | null;
  observaciones?: string | null;
  emitido_por_nombre?: string;
  contenido_renderizado?: string | null;
  plantilla_id?: number | null;
  firmante_nombre?: string | null;
  firmante_cargo?: string | null;
  firmante_firma_url?: string | null;
  created_at: string;
}

export interface GenerarDocumentoInput {
  personal_id: number;
  tipo_documento: TipoDocumentoLaboral;
  destinatario?: string;
  incluir_remuneracion?: boolean;
  observaciones?: string;
  contenido_personalizado?: string;
  firmante_nombre?: string;
  firmante_cargo?: string;
  firmante_firma_url?: string;
  plantilla_id?: number;
}


