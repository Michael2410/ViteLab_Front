import apiClient from '../../../shared/utils/apiClient';
import type { ApiResponse } from '../../../shared/types/api.types';
import type {
  FiltrosReporte,
  FiltrosCuadreCaja,
  ReporteOrdenesPeriodo,
  ReporteIngresosSede,
  ReporteAnalisisRanking,
  ReporteProductividad,
  ReporteCuadreCaja,
} from './types';

/**
 * Construir query string desde filtros generales
 */
const buildQueryString = (filtros: FiltrosReporte): string => {
  const params = new URLSearchParams();
  if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
  if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
  if (filtros.sede_id) params.append('sede_id', filtros.sede_id.toString());
  if (filtros.estado) params.append('estado', filtros.estado);
  if (filtros.metodo_pago) params.append('metodo_pago', filtros.metodo_pago);
  if (filtros.usuario_registro_id) params.append('usuario_registro_id', filtros.usuario_registro_id.toString());
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

/**
 * Reporte de Cuadre de Caja Diaria (Arqueo por Turno / Cajero)
 */
export const getReporteCuadreCaja = async (
  filtros: FiltrosCuadreCaja
): Promise<ReporteCuadreCaja> => {
  const params = new URLSearchParams();
  if (filtros.fecha) params.append('fecha', filtros.fecha);
  if (filtros.sede_id) params.append('sede_id', filtros.sede_id.toString());
  if (filtros.usuario_id) params.append('usuario_id', filtros.usuario_id.toString());

  const response = await apiClient.get<ApiResponse<ReporteCuadreCaja>>(
    `/reportes/cuadre-caja?${params.toString()}`
  );
  return response.data.data;
};
