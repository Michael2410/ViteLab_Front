import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse } from '../../shared/types/api.types';
import type {
  FiltrosReporte,
  ReporteOrdenesPeriodo,
  ReporteIngresosSede,
  ReporteAnalisisRanking,
  ReporteProductividad,
} from './types';

/**
 * Construir query string desde filtros
 */
const buildQueryString = (filtros: FiltrosReporte): string => {
  const params = new URLSearchParams();
  if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
  if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
  if (filtros.sede_id) params.append('sede_id', filtros.sede_id.toString());
  if (filtros.estado) params.append('estado', filtros.estado);
  return params.toString();
};

/**
 * Reporte de Órdenes por Período
 */
export const getReporteOrdenesPeriodo = async (
  filtros: FiltrosReporte
): Promise<ReporteOrdenesPeriodo> => {
  const query = buildQueryString(filtros);
  const response = await apiClient.get<ApiResponse<ReporteOrdenesPeriodo>>(
    `/reportes/ordenes-periodo?${query}`
  );
  return response.data.data;
};

/**
 * Reporte de Ingresos por Sede
 */
export const getReporteIngresosSede = async (
  filtros: FiltrosReporte
): Promise<ReporteIngresosSede> => {
  const query = buildQueryString(filtros);
  const response = await apiClient.get<ApiResponse<ReporteIngresosSede>>(
    `/reportes/ingresos-sede?${query}`
  );
  return response.data.data;
};

/**
 * Reporte de Análisis Más Solicitados
 */
export const getReporteAnalisisRanking = async (
  filtros: FiltrosReporte
): Promise<ReporteAnalisisRanking> => {
  const query = buildQueryString(filtros);
  const response = await apiClient.get<ApiResponse<ReporteAnalisisRanking>>(
    `/reportes/analisis-ranking?${query}`
  );
  return response.data.data;
};

/**
 * Reporte de Productividad por Usuario
 */
export const getReporteProductividad = async (
  filtros: FiltrosReporte
): Promise<ReporteProductividad> => {
  const query = buildQueryString(filtros);
  const response = await apiClient.get<ApiResponse<ReporteProductividad>>(
    `/reportes/productividad?${query}`
  );
  return response.data.data;
};
