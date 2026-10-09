export interface LoginRequest {
  username: string;
  password: string;
}

export interface SedeAsignada {
  id: number;
  nombre: string;
  codigo: string;
}

export interface TenantSummary {
  id: string;
  slug: string;
  name: string;
  role?: string;
  isCurrent?: boolean;
  isOwner?: boolean;
}

export interface User {
  id: number;
  username: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol_id: number;
  rol_nombre: string;
  rol_descripcion: string;
  permisos?: string[];
  firma_url?: string;
  sedes?: SedeAsignada[];
  activo: boolean;
  two_factor_enabled?: boolean;
  created_at: string;
  updated_at: string;
  activeTenant?: TenantSummary;
}

export interface Login2FARequired {
  requires2FA: true;
  requiresTenantSelection?: false;
  setupNeeded: boolean;
  tempToken: string;
  qrCodeDataUrl?: string;
  manualKey?: string;
}

export interface LoginTenantRequired {
  requiresTenantSelection: true;
  requires2FA?: false;
  requiresPasswordChange?: false;
  tempToken: string;
  tenants: TenantSummary[];
}

export interface LoginPasswordChangeRequired {
  requiresPasswordChange: true;
  requires2FA?: false;
  requiresTenantSelection?: false;
  tempToken: string;
  email: string;
  nombres?: string;
}

export interface LoginSuccess {
  requires2FA?: false;
  requiresTenantSelection?: false;
  requiresPasswordChange?: false;
  accessToken: string;
  refreshToken: string;
  user: User;
  activeTenant?: TenantSummary;
  backupCodes?: string[];
}

export type LoginResponse =
  | LoginSuccess
  | Login2FARequired
  | LoginTenantRequired
  | LoginPasswordChangeRequired;

export interface Verify2FARequest {
  tempToken: string;
  code: string;
}

export interface Confirm2FASetupRequest {
  tempToken: string;
  code: string;
}

export interface SelectTenantRequest {
  tempToken: string;
  tenantId: string;
}

export interface SwitchTenantRequest {
  tenantId: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
