import apiClient from '../../../shared/utils/apiClient';
import type { ApiResponse } from './types';

export const almacenApi = {
  get: async <T>(url: string, params?: Record<string, any>): Promise<T> => {
    let cleanParams = params;
    if (params) {
      cleanParams = { ...params };
      for (const key of Object.keys(cleanParams)) {
        const val = cleanParams[key];
        if (Array.isArray(val)) {
          cleanParams[key] = val.join(',');
        }
      }
    }
    const res = await apiClient.get<ApiResponse<T>>(`/almacen${url}`, { params: cleanParams });
    return res.data.data;
  },

  post: async <T>(url: string, body?: any): Promise<T> => {
    const res = await apiClient.post<ApiResponse<T>>(`/almacen${url}`, body);
    return res.data.data;
  },

  put: async <T>(url: string, body?: any): Promise<T> => {
    const res = await apiClient.put<ApiResponse<T>>(`/almacen${url}`, body);
    return res.data.data;
  },

  delete: async <T>(url: string): Promise<T> => {
    const res = await apiClient.delete<ApiResponse<T>>(`/almacen${url}`);
    return res.data.data;
  },
};
