import { almacenApi } from '../shared/almacen.api';
import type { Paginado } from '../shared/types';
import type { StockItem, KardexItem, ListarStockParams, ListarKardexParams } from './stock.types';

export const stockApi = {
  listarStock: (params: ListarStockParams) =>
    almacenApi.get<Paginado<StockItem>>('/stock', params),

  listarKardex: (params: ListarKardexParams) =>
    almacenApi.get<Paginado<KardexItem>>('/stock/kardex', params),
};
