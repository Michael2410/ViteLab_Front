import { almacenApi } from '../shared/almacen.api';
import type { Paginado } from '../shared/types';
import type {
  Transferencia,
  ListarTransferenciasParams,
  CrearTransferenciaDTO,
  RecibirTransferenciaDTO,
} from './transferencias.types';

export const transferenciasApi = {
  listar: (params: ListarTransferenciasParams) =>
    almacenApi.get<Paginado<Transferencia>>('/transferencias', params),

  obtener: (id: number) =>
    almacenApi.get<Transferencia>(`/transferencias/${id}`),

  crear: (data: CrearTransferenciaDTO) =>
    almacenApi.post<Transferencia>('/transferencias', data),

  recibir: (id: number, data: RecibirTransferenciaDTO) =>
    almacenApi.post<Transferencia>(`/transferencias/${id}/recibir`, data),

  anular: (id: number, motivo: string) =>
    almacenApi.post<Transferencia>(`/transferencias/${id}/anular`, { motivo }),
};
