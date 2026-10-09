export interface PlantillaDocumento {
  id: number;
  tipo_documento: string;
  nombre: string;
  titulo_documento: string;
  cuerpo_template: string;
  parrafo_cierre?: string | null;
  ciudad_defecto?: string | null;
  mostrar_logo?: boolean | null;
  firmante_nombre?: string | null;
  firmante_cargo?: string | null;
  firmante_firma_url?: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CrearPlantillaDTO {
  tipo_documento: string;
  nombre: string;
  titulo_documento: string;
  cuerpo_template: string;
  parrafo_cierre?: string | null;
  ciudad_defecto?: string | null;
  mostrar_logo?: boolean;
  firmante_nombre?: string | null;
  firmante_cargo?: string | null;
  firmante_firma_url?: string | null;
  activo?: boolean;
}

export interface ActualizarPlantillaDTO {
  nombre?: string;
  titulo_documento?: string;
  cuerpo_template?: string;
  parrafo_cierre?: string | null;
  ciudad_defecto?: string | null;
  mostrar_logo?: boolean;
  firmante_nombre?: string | null;
  firmante_cargo?: string | null;
  firmante_firma_url?: string | null;
  activo?: boolean;
}

export interface VariablePlantilla {
  tag: string;
  label: string;
  origen: 'SISTEMA' | 'COLABORADOR' | 'FECHAS';
  ejemplo: string;
}

export const VARIABLES_DOCUMENTO: VariablePlantilla[] = [
  // De Parámetros del Sistema
  { tag: '{empresa_nombre}', label: 'Nombre / Razón Social Empresa', origen: 'SISTEMA', ejemplo: 'CLINICA INTERNACIONAL S.A.' },
  { tag: '{empresa_ruc}', label: 'R.U.C. Empresa', origen: 'SISTEMA', ejemplo: '20100054184' },
  { tag: '{empresa_direccion}', label: 'Dirección Empresa', origen: 'SISTEMA', ejemplo: 'Jr. Washington Nro. 1471 - Lima' },

  // Del Colaborador
  { tag: '{colaborador_nombre}', label: 'Nombre Completo (Apellidos y Nombres)', origen: 'COLABORADOR', ejemplo: 'GOMEZ HUARAC, MICHAEL ESTEBEN' },
  { tag: '{colaborador_apellidos}', label: 'Apellidos del Colaborador', origen: 'COLABORADOR', ejemplo: 'GOMEZ HUARAC' },
  { tag: '{colaborador_nombres}', label: 'Nombres del Colaborador', origen: 'COLABORADOR', ejemplo: 'MICHAEL ESTEBEN' },
  { tag: '{colaborador_documento}', label: 'Tipo y N° Documento', origen: 'COLABORADOR', ejemplo: 'DNI Nro. 70904523' },
  { tag: '{cargo}', label: 'Cargo Desempeñado', origen: 'COLABORADOR', ejemplo: 'OPERADOR DE PLATAFORMA Y APLICACIONES' },
  { tag: '{area}', label: 'Área / Departamento', origen: 'COLABORADOR', ejemplo: 'SERVICIOS DE PLATAFORMAS Y APLICACIONES' },
  { tag: '{sueldo}', label: 'Sueldo / Remuneración', origen: 'COLABORADOR', ejemplo: 'S/ 2,500.00' },

  // Fechas y Emisión
  { tag: '{fecha_ingreso}', label: 'Fecha de Ingreso / Inicio', origen: 'FECHAS', ejemplo: '01 de Mayo del 2023' },
  { tag: '{fecha_cese}', label: 'Fecha de Cese / Fin', origen: 'FECHAS', ejemplo: '06 de Septiembre del 2025' },
  { tag: '{fecha_emision}', label: 'Fecha de Emisión Formal', origen: 'FECHAS', ejemplo: '31 de Agosto del 2025' },
  { tag: '{ciudad_emision}', label: 'Ciudad de Emisión', origen: 'FECHAS', ejemplo: 'LIMA' },
  { tag: '{destinatario}', label: 'Destinatario', origen: 'FECHAS', ejemplo: 'A quien corresponda' },
];
