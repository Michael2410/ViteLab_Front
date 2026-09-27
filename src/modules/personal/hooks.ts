import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  personalApi,
  personalCatalogosApi,
  personalHistorialApi,
  personalContratosApi,
  personalVacacionesApi,
  personalAsistenciaApi,
  personalDocumentosApi,
} from './api';
import type {
  CreatePersonalInput,
  UpdatePersonalInput,
  VincularCuentaInput,
  DarDeBajaPersonalInput,
  UpdateCuentaInput,
  PersonalFilters,
  CatalogoTipo,
} from './types';

export const personalKeys = {
  all: ['personal'] as const,
  list: (filtros?: PersonalFilters) => ['personal', 'list', filtros] as const,
  detail: (id: number) => ['personal', 'detail', id] as const,
};

export const usePersonalList = (filtros?: PersonalFilters) => {
  return useQuery({
    queryKey: personalKeys.list(filtros),
    queryFn: () => personalApi.getAll(filtros),
  });
};

export const usePersonal = (id: number) => {
  return useQuery({
    queryKey: personalKeys.detail(id),
    queryFn: () => personalApi.getById(id),
    enabled: !!id,
  });
};

export const useCrearPersonal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePersonalInput) => personalApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalKeys.all });
      message.success('Colaborador registrado exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al registrar colaborador');
    },
  });
};

export const useActualizarPersonal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePersonalInput }) =>
      personalApi.update(id, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: personalKeys.all });
      queryClient.invalidateQueries({ queryKey: personalKeys.detail(variables.id) });
      message.success('Datos actualizados exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al actualizar colaborador');
    },
  });
};

export const useEliminarPersonal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => personalApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalKeys.all });
      message.success('Colaborador desactivado');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al desactivar colaborador');
    },
  });
};

export const useDarDeBajaPersonal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DarDeBajaPersonalInput }) =>
      personalApi.darDeBaja(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalKeys.all });
      message.success('Colaborador dado de baja exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al procesar baja de colaborador');
    },
  });
};

export const useReincorporarPersonal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => personalApi.reincorporar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalKeys.all });
      message.success('Colaborador reincorporado exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al reincorporar colaborador');
    },
  });
};

export const useVincularCuenta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personalId, data }: { personalId: number; data: VincularCuentaInput }) =>
      personalApi.vincularCuenta(personalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalKeys.all });
      message.success('Cuenta de sistema vinculada exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al vincular cuenta');
    },
  });
};

export const useUpdateCuentaPersonal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personalId, data }: { personalId: number; data: UpdateCuentaInput }) =>
      personalApi.updateCuenta(personalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalKeys.all });
      message.success('Cuenta de sistema actualizada');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al actualizar cuenta de sistema');
    },
  });
};

export const useDesvincularCuenta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (personalId: number) => personalApi.desvincularCuenta(personalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalKeys.all });
      message.success('Cuenta de sistema desvinculada');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al desvincular cuenta');
    },
  });
};

// ============================================
// HOOKS PARA CATÁLOGOS CONFIGURABLES
// ============================================

export const catalogoKeys = {
  all: ['personal-catalogos'] as const,
  list: (tipo: CatalogoTipo, activosOnly?: boolean) =>
    ['personal-catalogos', tipo, { activosOnly }] as const,
};

export const useCatalogos = (tipo: CatalogoTipo, activosOnly: boolean = false) => {
  return useQuery({
    queryKey: catalogoKeys.list(tipo, activosOnly),
    queryFn: () => personalCatalogosApi.getAll(tipo, activosOnly),
  });
};

export const useCargos = (activosOnly: boolean = false) => useCatalogos('cargos', activosOnly);
export const useAreasPersonal = (activosOnly: boolean = false) => useCatalogos('areas', activosOnly);
export const useTiposContrato = (activosOnly: boolean = false) => useCatalogos('tipos-contrato', activosOnly);
export const useMotivosCese = (activosOnly: boolean = false) => useCatalogos('motivos-cese', activosOnly);

export const useCrearCatalogoItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tipo,
      data,
    }: {
      tipo: CatalogoTipo;
      data: { nombre: string; descripcion?: string | null };
    }) => personalCatalogosApi.create(tipo, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['personal-catalogos', variables.tipo] });
      message.success('Elemento agregado exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al agregar elemento');
    },
  });
};

export const useActualizarCatalogoItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tipo,
      id,
      data,
    }: {
      tipo: CatalogoTipo;
      id: number;
      data: { nombre?: string; descripcion?: string | null; activo?: boolean };
    }) => personalCatalogosApi.update(tipo, id, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['personal-catalogos', variables.tipo] });
      queryClient.invalidateQueries({ queryKey: personalKeys.all });
      message.success('Elemento actualizado exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al actualizar elemento');
    },
  });
};

export const useEliminarCatalogoItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tipo, id }: { tipo: CatalogoTipo; id: number }) =>
      personalCatalogosApi.delete(tipo, id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['personal-catalogos', variables.tipo] });
      queryClient.invalidateQueries({ queryKey: personalKeys.all });
      if (data?.deactivated) {
        message.warning(data.message);
      } else {
        message.success(data?.message || 'Elemento eliminado');
      }
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al eliminar elemento');
    },
  });
};

// ============================================
// HOOKS: HISTORIAL LABORAL (AUDITORÍA)
// ============================================
export const useHistorialLaboral = (personalId: number) => {
  return useQuery({
    queryKey: ['personal', personalId, 'historial'],
    queryFn: () => personalHistorialApi.getByPersonalId(personalId),
    enabled: !!personalId,
  });
};

// ============================================
// HOOKS: CONTRATOS & VENCIMIENTOS
// ============================================
export const useContratosList = (filtros?: import('./types').ContratoFilters) => {
  return useQuery({
    queryKey: ['contratos', 'list', filtros],
    queryFn: () => personalContratosApi.getAll(filtros),
  });
};

export const useContratosByPersonal = (personalId: number) => {
  return useQuery({
    queryKey: ['contratos', 'personal', personalId],
    queryFn: () => personalContratosApi.getByPersonalId(personalId),
    enabled: !!personalId,
  });
};

export const useCrearContrato = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ personalId, data }: { personalId: number; data: import('./types').CreateContratoInput }) =>
      personalContratosApi.create(personalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: personalKeys.all });
      message.success('Contrato registrado exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al registrar contrato');
    },
  });
};

export const useActualizarContrato = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: import('./types').UpdateContratoInput }) =>
      personalContratosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: personalKeys.all });
      message.success('Contrato actualizado exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al actualizar contrato');
    },
  });
};

export const useEliminarContrato = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => personalContratosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      message.success('Contrato eliminado exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al eliminar contrato');
    },
  });
};

export const useRenovarContrato = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: import('./types').CreateContratoInput }) =>
      personalContratosApi.renovar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: personalKeys.all });
      message.success('Contrato renovado exitosamente');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Error al renovar contrato');
    },
  });
};

// ============================================
// HOOKS: VACACIONES
// ============================================
export const useVacacionesSolicitudes = () => {
  return useQuery({
    queryKey: ['vacaciones', 'solicitudes'],
    queryFn: () => personalVacacionesApi.getSolicitudes(),
  });
};

export const useCrearSolicitudVacacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      colaboradorNombre,
      colaboradorCargo,
    }: {
      data: import('./types').CreateSolicitudVacacionInput;
      colaboradorNombre?: string;
      colaboradorCargo?: string;
    }) => personalVacacionesApi.crearSolicitud(data, colaboradorNombre, colaboradorCargo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacaciones', 'solicitudes'] });
      message.success('Solicitud de vacaciones enviada');
    },
    onError: (error: any) => {
      message.error(error.message || 'Error al registrar solicitud');
    },
  });
};

export const useCambiarEstadoVacacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      estado,
      observaciones,
      aprobadorNombre,
    }: {
      id: number;
      estado: import('./types').EstadoVacacion;
      observaciones?: string;
      aprobadorNombre?: string;
    }) => personalVacacionesApi.cambiarEstado(id, estado, observaciones, aprobadorNombre),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vacaciones', 'solicitudes'] });
      message.success(`Solicitud ${variables.estado.toLowerCase()} exitosamente`);
    },
    onError: (error: any) => {
      message.error(error.message || 'Error al actualizar solicitud');
    },
  });
};

// ============================================
// HOOKS: ASISTENCIA & FALTAS
// ============================================
export const useAsistenciaList = (filtros?: import('./types').FiltrosAsistencia) => {
  return useQuery({
    queryKey: ['asistencia', 'list', filtros],
    queryFn: () => personalAsistenciaApi.getAll(filtros),
  });
};

export const useRegistrarAsistencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      colabInfo,
    }: {
      data: import('./types').RegistrarAsistenciaInput;
      colabInfo: { nombre: string; documento?: string; cargo: string; area: string; sede?: string };
    }) => personalAsistenciaApi.registrar(data, colabInfo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asistencia', 'list'] });
      message.success('Registro de asistencia guardado');
    },
    onError: (error: any) => {
      message.error(error.message || 'Error al guardar asistencia');
    },
  });
};

export const useActualizarAsistencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<import('./types').RegistrarAsistenciaInput>;
    }) => personalAsistenciaApi.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asistencia', 'list'] });
      message.success('Registro de asistencia actualizado');
    },
    onError: (error: any) => {
      message.error(error.message || 'Error al actualizar asistencia');
    },
  });
};

export const useEliminarAsistencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => personalAsistenciaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asistencia', 'list'] });
      message.success('Registro de asistencia eliminado');
    },
    onError: (error: any) => {
      message.error(error.message || 'Error al eliminar registro');
    },
  });
};

// ============================================
// HOOKS: DOCUMENTOS & CONSTANCIAS
// ============================================
export const useDocumentosLaboralesList = () => {
  return useQuery({
    queryKey: ['documentos-laborales', 'list'],
    queryFn: () => personalDocumentosApi.getAll(),
  });
};

export const useGenerarDocumentoLaboral = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      colaborador,
      emitidoPor,
    }: {
      data: import('./types').GenerarDocumentoInput;
      colaborador: { nombre: string; documento: string; cargo: string; sueldo?: number | null };
      emitidoPor?: string;
    }) => personalDocumentosApi.generar(data, colaborador, emitidoPor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-laborales', 'list'] });
      message.success('Documento laboral generado exitosamente');
    },
    onError: (error: any) => {
      message.error(error.message || 'Error al generar documento');
    },
  });
};



