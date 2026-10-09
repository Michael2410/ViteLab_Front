import apiClient from '../../shared/utils/apiClient';
import type {
  Personal,
  CreatePersonalInput,
  UpdatePersonalInput,
  VincularCuentaInput,
  DarDeBajaPersonalInput,
  UpdateCuentaInput,
  PersonalFilters,
  PersonalUsuarioInfo,
  PersonalCatalogoItem,
  CatalogoTipo,
} from './types';

function cleanQueryParams(params?: Record<string, any>) {
  if (!params) return undefined;
  const clean = { ...params };
  for (const k of Object.keys(clean)) {
    const v = clean[k];
    if (Array.isArray(v)) {
      clean[k] = v.join(',');
    }
  }
  return clean;
}

export const personalApi = {
  // Obtener todo el personal con filtros opcionales
  getAll: async (filtros?: PersonalFilters): Promise<Personal[]> => {
    const { data } = await apiClient.get('/personal', { params: cleanQueryParams(filtros) });
    return data.data;
  },

  // Obtener personal por ID
  getById: async (id: number): Promise<Personal> => {
    const { data } = await apiClient.get(`/personal/${id}`);
    return data.data;
  },

  // Crear personal
  create: async (colaborador: CreatePersonalInput): Promise<Personal> => {
    const { data } = await apiClient.post('/personal', colaborador);
    return data.data;
  },

  // Actualizar personal
  update: async (id: number, colaborador: UpdatePersonalInput): Promise<Personal> => {
    const { data } = await apiClient.put(`/personal/${id}`, colaborador);
    return data.data;
  },

  // Desactivar personal
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/personal/${id}`);
  },

  // Dar de baja personal (cese por renuncia, etc.)
  darDeBaja: async (id: number, datosCese: DarDeBajaPersonalInput): Promise<Personal> => {
    const { data } = await apiClient.post(`/personal/${id}/dar-de-baja`, datosCese);
    return data.data;
  },

  // Reincorporar personal cesado
  reincorporar: async (id: number): Promise<Personal> => {
    const { data } = await apiClient.post(`/personal/${id}/reincorporar`);
    return data.data;
  },

  // Crear y vincular cuenta de sistema
  vincularCuenta: async (personalId: number, cuenta: VincularCuentaInput): Promise<PersonalUsuarioInfo> => {
    const { data } = await apiClient.post(`/personal/${personalId}/cuenta`, cuenta);
    return data.data;
  },

  // Actualizar cuenta de sistema (activar/inactivar, rol, password)
  updateCuenta: async (personalId: number, cuenta: UpdateCuentaInput): Promise<PersonalUsuarioInfo> => {
    const { data } = await apiClient.put(`/personal/${personalId}/cuenta`, cuenta);
    return data.data;
  },

  // Desvincular / revocar cuenta de sistema
  desvincularCuenta: async (personalId: number): Promise<void> => {
    await apiClient.delete(`/personal/${personalId}/cuenta`);
  },
};

export const personalCatalogosApi = {
  getAll: async (tipo: CatalogoTipo, activosOnly: boolean = false): Promise<PersonalCatalogoItem[]> => {
    const { data } = await apiClient.get(`/personal/catalogos/${tipo}`, {
      params: activosOnly ? { activos: true } : undefined,
    });
    const items = data.data || [];
    return items.map((item: any) => {
      const count = Number(item.total_personal ?? item.total_colaboradores ?? 0);
      return {
        ...item,
        total_personal: count,
        total_colaboradores: count,
      };
    });
  },

  create: async (
    tipo: CatalogoTipo,
    item: { nombre: string; descripcion?: string | null }
  ): Promise<PersonalCatalogoItem> => {
    const { data } = await apiClient.post(`/personal/catalogos/${tipo}`, item);
    return data.data;
  },

  update: async (
    tipo: CatalogoTipo,
    id: number,
    item: { nombre?: string; descripcion?: string | null; activo?: boolean }
  ): Promise<PersonalCatalogoItem> => {
    const { data } = await apiClient.put(`/personal/catalogos/${tipo}/${id}`, item);
    return data.data;
  },

  delete: async (
    tipo: CatalogoTipo,
    id: number
  ): Promise<{ deleted: boolean; deactivated?: boolean; message: string }> => {
    const { data } = await apiClient.delete(`/personal/catalogos/${tipo}/${id}`);
    return data.data;
  },
};

// ============================================
// API HISTORIAL LABORAL (LOG AUDITORÍA)
// ============================================
export const personalHistorialApi = {
  getByPersonalId: async (personalId: number) => {
    const { data } = await apiClient.get(`/personal/${personalId}/historial`);
    return data.data;
  },

  registrarEvento: async (personalId: number, evento: any) => {
    const { data } = await apiClient.post(`/personal/${personalId}/historial`, evento);
    return data.data;
  },
};

// ============================================
// API CONTRATOS & VENCIMIENTOS
// ============================================
export const personalContratosApi = {
  getAll: async (filtros?: import('./types').ContratoFilters): Promise<import('./types').ContratoItem[]> => {
    const { data } = await apiClient.get('/personal/contratos', { params: filtros });
    return data.data;
  },

  getByPersonalId: async (personalId: number): Promise<import('./types').ContratoItem[]> => {
    const { data } = await apiClient.get(`/personal/${personalId}/contratos`);
    return data.data;
  },

  getById: async (id: number): Promise<import('./types').ContratoItem> => {
    const { data } = await apiClient.get(`/personal/contratos/${id}`);
    return data.data;
  },

  create: async (personalId: number, contrato: import('./types').CreateContratoInput): Promise<import('./types').ContratoItem> => {
    const { data } = await apiClient.post(`/personal/${personalId}/contratos`, contrato);
    return data.data;
  },

  update: async (id: number, contrato: import('./types').UpdateContratoInput): Promise<import('./types').ContratoItem> => {
    const { data } = await apiClient.put(`/personal/contratos/${id}`, contrato);
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/personal/contratos/${id}`);
  },

  renovar: async (id: number, contratoNuevo: import('./types').CreateContratoInput): Promise<import('./types').ContratoItem> => {
    const { data } = await apiClient.post(`/personal/contratos/${id}/renovar`, contratoNuevo);
    return data.data;
  },
};

// ============================================
// API VACACIONES
// ============================================
export const personalVacacionesApi = {
  getSolicitudes: async (filtros?: { personal_id?: number; estado?: import('./types').EstadoVacacion | string | string[] }): Promise<import('./types').SolicitudVacacion[]> => {
    const { data } = await apiClient.get('/personal/vacaciones', { params: cleanQueryParams(filtros) });
    return data.data;
  },

  crearSolicitud: async (
    dataInput: import('./types').CreateSolicitudVacacionInput,
    _colaboradorNombre?: string,
    _colaboradorCargo?: string
  ): Promise<import('./types').SolicitudVacacion> => {
    const { data } = await apiClient.post('/personal/vacaciones', dataInput);
    return data.data;
  },

  cambiarEstado: async (
    id: number,
    estado: import('./types').EstadoVacacion,
    observaciones?: string,
    _aprobadorNombre?: string
  ): Promise<import('./types').SolicitudVacacion> => {
    const { data } = await apiClient.put(`/personal/vacaciones/${id}/estado`, {
      estado,
      observaciones_aprobador: observaciones,
    });
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/personal/vacaciones/${id}`);
  },
};

// ============================================
// API ASISTENCIA & FALTAS
// ============================================
export const personalAsistenciaApi = {
  getAll: async (filtros?: import('./types').FiltrosAsistencia): Promise<import('./types').RegistroAsistencia[]> => {
    const { data } = await apiClient.get('/personal/asistencia', { params: cleanQueryParams(filtros) });
    return data.data;
  },

  registrar: async (
    dataInput: import('./types').RegistrarAsistenciaInput,
    _colabInfo?: { nombre: string; documento?: string; cargo: string; area: string; sede?: string }
  ): Promise<import('./types').RegistroAsistencia> => {
    const { data } = await apiClient.post('/personal/asistencia', dataInput);
    return data.data;
  },

  actualizar: async (
    id: number,
    dataInput: Partial<import('./types').RegistrarAsistenciaInput>
  ): Promise<import('./types').RegistroAsistencia> => {
    const { data } = await apiClient.put(`/personal/asistencia/${id}`, dataInput);
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/personal/asistencia/${id}`);
  },
};

// ============================================
// API DOCUMENTOS & CONSTANCIAS
// ============================================
export const personalDocumentosApi = {
  getAll: async (filtros?: { personal_id?: number; tipo_documento?: string | string[] }): Promise<import('./types').DocumentoLaboralItem[]> => {
    const { data } = await apiClient.get('/personal/documentos', { params: cleanQueryParams(filtros) });
    return data.data;
  },

  getById: async (id: number): Promise<any> => {
    const { data } = await apiClient.get(`/personal/documentos/${id}`);
    return data.data;
  },

  generar: async (
    dataInput: import('./types').GenerarDocumentoInput,
    _colaborador?: { nombre: string; documento: string; cargo: string; sueldo?: number | null },
    _emitidoPor?: string
  ): Promise<import('./types').DocumentoLaboralItem> => {
    const { data } = await apiClient.post('/personal/documentos/generar', dataInput);
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/personal/documentos/${id}`);
  },
};




