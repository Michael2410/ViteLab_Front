// ============================================
// INTERFACES
// ============================================

export interface OrdenParaResultados {
  id: number;
  numero_atencion: number;
  estado: string;
  fecha_registro: string;
  paciente_dni: string;
  paciente_nombres: string;
  paciente_apellidos: string;
  sede_nombre: string;
  total_analisis: number;
}

export interface ComponenteConResultado {
  componente_id: number;
  componente_nombre: string;
  unidad_medida?: string | null;
  valores_referenciales?: string[];
  valor_alerta_min?: number | null;
  valor_alerta_max?: number | null;
  metodo_nombre?: string | null;
  resultado_id?: number | null;
  resultado_valor?: string | null;
  resultado_observaciones?: string | null;
  tiene_resultado: boolean;
}

export interface AnalisisConComponentes {
  orden_analisis_id: number;
  analisis_id: number;
  analisis_nombre: string;
  componentes: ComponenteConResultado[];
}

export interface OrdenConResultados {
  id: number;
  numero_atencion: number;
  estado: string;
  paciente_nombres: string;
  paciente_apellidos: string;
  paciente_dni: string;
  paciente_genero?: string;
  paciente_fecha_nacimiento?: string;
  fecha_registro: string;
  fecha_aprobacion?: string;
  sede_nombre?: string;
  tipo_cliente_nombre?: string;
  convenio_nombre?: string;
  convenio_direccion?: string;
  convenio_logo_url?: string;
  medico?: string;
  aprobado_por_nombres?: string;
  aprobado_por_apellidos?: string;
  aprobado_por_firma_url?: string;
  interpretacion_ia?: string | null;
  analisis: AnalisisConComponentes[];
}

export interface Resultado {
  id: number;
  orden_analisis_id: number;
  componente_id: number;
  valor: string;
  unidad_medida?: string | null;
  valor_referencia?: string | null;
  observaciones?: string | null;
  usuario_registro_id: number;
  created_at: string;
  updated_at: string;
}

export interface ResultadoDetalle extends Resultado {
  componente_nombre: string;
  orden_id: number;
  numero_atencion: number;
  analisis_nombre: string;
  usuario_registro_nombre?: string;
}

// ============================================
// FORM INPUTS
// ============================================

export interface CreateResultadoInput {
  orden_analisis_id: number;
  componente_id: number;
  valor: string;
  unidad_medida?: string;
  observaciones?: string;
}

export interface BulkResultadosInput {
  orden_id: number;
  resultados: {
    orden_analisis_id: number;
    componente_id: number;
    valor: string;
    unidad_medida?: string;
    observaciones?: string;
  }[];
}

export interface UpdateResultadoInput {
  valor?: string;
  unidad_medida?: string;
  observaciones?: string;
}

// ============================================
// HELPERS
// ============================================

export interface ResultadoFormValues {
  [key: string]: {
    valor: string;
    observaciones?: string;
  };
}

/**
 * Genera una clave única para identificar un componente en el formulario
 */
export const getComponenteKey = (ordenAnalisisId: number, componenteId: number): string => {
  return `${ordenAnalisisId}_${componenteId}`;
};

/**
 * Verifica si un valor está dentro del rango de referencia
 */
export const isValorFueraDeRango = (
  valor: string,
  min?: number | null,
  max?: number | null
): boolean => {
  const valorNum = parseFloat(valor);
  
  if (isNaN(valorNum) || (!min && !max)) {
    return false;
  }

  if (min !== null && min !== undefined && valorNum < min) {
    return true;
  }

  if (max !== null && max !== undefined && valorNum > max) {
    return true;
  }

  return false;
};

/**
 * Obtiene el porcentaje de completitud de resultados
 */
export const calcularProgreso = (analisis: AnalisisConComponentes[]): {
  total: number;
  completados: number;
  porcentaje: number;
} => {
  let total = 0;
  let completados = 0;

  analisis.forEach((a) => {
    total += a.componentes.length;
    completados += a.componentes.filter((c) => c.tiene_resultado).length;
  });

  const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

  return { total, completados, porcentaje };
};
