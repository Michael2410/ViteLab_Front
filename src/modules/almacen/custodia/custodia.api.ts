import { almacenApi } from '../shared/almacen.api';
import type { Paginado } from '../shared/types';
import type {
  ItemCustodia,
  CustodiaResumen,
  ListarCustodiaParams,
  Consumo,
  CrearConsumoDTO,
  Devolucion,
  CrearDevolucionDTO,
} from './custodia.types';

export const custodiaApi = {
  listar: (params: ListarCustodiaParams) =>
    almacenApi.get<Paginado<ItemCustodia>>('/custodia', params),

  obtenerResumen: (personalId?: number) =>
    almacenApi.get<CustodiaResumen>('/custodia/resumen', { personal_id: personalId }),

  // Consumos
  listarConsumos: (params: Record<string, any>) =>
    almacenApi.get<Paginado<Consumo>>('/consumos', params),

  obtenerConsumo: (id: number) =>
    almacenApi.get<Consumo>(`/consumos/${id}`),

  crearConsumo: (data: CrearConsumoDTO) =>
    almacenApi.post<Consumo>('/consumos', data),

  anularConsumo: (id: number, motivo: string) =>
    almacenApi.post<Consumo>(`/consumos/${id}/anular`, { motivo }),

  // Devoluciones
  listarDevoluciones: (params: Record<string, any>) =>
    almacenApi.get<Paginado<Devolucion>>('/consumos/devoluciones/todas', params),

  obtenerDevolucion: (id: number) =>
    almacenApi.get<Devolucion>(`/consumos/devoluciones/${id}`),

  crearDevolucion: (data: CrearDevolucionDTO) =>
    almacenApi.post<Devolucion>('/consumos/devoluciones', data),

  anularDevolucion: (id: number, motivo: string) =>
    almacenApi.post<Devolucion>(`/consumos/devoluciones/${id}/anular`, { motivo }),
};
