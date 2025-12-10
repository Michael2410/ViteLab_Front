// Tipos para el módulo de configuración del sistema

export interface ConfiguracionSistema {
  id: number;
  empresa_nombre: string;
  empresa_razon_social: string | null;
  empresa_ruc: string | null;
  empresa_direccion: string | null;
  empresa_telefono: string | null;
  empresa_email: string | null;
  empresa_web: string | null;
  logo_principal: string | null;
  logo_secundario: string | null;
  encabezado_reporte: string | null;
  pie_reporte: string | null;
  moneda: string;
  igv_porcentaje: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateConfiguracionInput {
  empresa_nombre?: string;
  empresa_razon_social?: string | null;
  empresa_ruc?: string | null;
  empresa_direccion?: string | null;
  empresa_telefono?: string | null;
  empresa_email?: string | null;
  empresa_web?: string | null;
  logo_principal?: string | null;
  logo_secundario?: string | null;
  encabezado_reporte?: string | null;
  pie_reporte?: string | null;
  moneda?: string;
  igv_porcentaje?: number;
}

// Tipos para el dashboard
export interface SedeStats {
  id: number;
  nombre: string;
  color: string;
  ordenes_hoy: number;
  ordenes_pendientes: number;
  ordenes_con_resultados: number;
  ordenes_aprobadas: number;
}

export interface DashboardStats {
  sedes: SedeStats[];
  totales: {
    ordenes_hoy: number;
    pendientes_resultados: number;
    con_resultados: number;
    aprobadas: number;
  };
}
