import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse } from '../../shared/types/api.types';
import type { LoginRequest, LoginResponse, RefreshTokenResponse } from './types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    console.log('📤 API login called with:', credentials);
    try {
      const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
      console.log('📥 API login response:', data);
      return data;
    } catch (error: any) {
      console.log('📥 API login error caught:', error);
      console.log('📥 API login error response:', error.response);
      throw error;
    }
  },

  refresh: async (refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> => {
    const { data } = await apiClient.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', {
      refreshToken,
    });
    return data;
  },

  logout: async (): Promise<ApiResponse> => {
    const { data } = await apiClient.post<ApiResponse>('/auth/logout');
    return data;
  },

  me: async (): Promise<ApiResponse<LoginResponse['user']>> => {
    const { data } = await apiClient.get<ApiResponse<LoginResponse['user']>>('/auth/me');
    return data;
  },
};
