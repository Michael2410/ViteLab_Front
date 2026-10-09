import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse } from '../../shared/types/api.types';
import type {
  LoginRequest,
  LoginResponse,
  LoginSuccess,
  Verify2FARequest,
  Confirm2FASetupRequest,
  SelectTenantRequest,
  SwitchTenantRequest,
  TenantSummary,
  RefreshTokenResponse,
  User,
} from './types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return data;
  },

  selectTenant: async (body: SelectTenantRequest): Promise<ApiResponse<LoginSuccess>> => {
    const { data } = await apiClient.post<ApiResponse<LoginSuccess>>('/auth/select-tenant', body);
    return data;
  },

  switchTenant: async (body: SwitchTenantRequest): Promise<ApiResponse<LoginSuccess>> => {
    const { data } = await apiClient.post<ApiResponse<LoginSuccess>>('/auth/switch-tenant', body);
    return data;
  },

  getMyTenants: async (): Promise<ApiResponse<(TenantSummary & { isCurrent: boolean })[]>> => {
    const { data } = await apiClient.get<ApiResponse<(TenantSummary & { isCurrent: boolean })[]>>('/auth/my-tenants');
    return data;
  },

  changeInitialPassword: async (body: {
    tempToken: string;
    newPassword: string;
  }): Promise<ApiResponse<LoginResponse>> => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/change-initial-password',
      body
    );
    return data;
  },

  verify2FA: async (body: Verify2FARequest): Promise<ApiResponse<LoginSuccess>> => {
    const { data } = await apiClient.post<ApiResponse<LoginSuccess>>('/auth/2fa/verify', body);
    return data;
  },

  confirm2FASetup: async (body: Confirm2FASetupRequest): Promise<ApiResponse<LoginSuccess>> => {
    const { data } = await apiClient.post<ApiResponse<LoginSuccess>>('/auth/2fa/confirm-setup', body);
    return data;
  },

  adminReset2FA: async (userId: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post<ApiResponse<null>>(`/auth/2fa/admin-reset/${userId}`);
    return data;
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

  me: async (): Promise<ApiResponse<User>> => {
    const { data } = await apiClient.get<ApiResponse<User>>('/auth/me');
    return data;
  },
};
