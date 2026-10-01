export interface LoginRequest {
  username: string;
  password: string;
}

export interface SedeAsignada {
  id: number;
  nombre: string;
  codigo: string;
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
}

export interface Login2FARequired {
  requires2FA: true;
  setupNeeded: boolean;
  tempToken: string;
  qrCodeDataUrl?: string;
  manualKey?: string;
}

export interface LoginSuccess {
  requires2FA?: false;
  accessToken: string;
  refreshToken: string;
  user: User;
  backupCodes?: string[];
}

export type LoginResponse = LoginSuccess | Login2FARequired;

export interface Verify2FARequest {
  tempToken: string;
  code: string;
}

export interface Confirm2FASetupRequest {
  tempToken: string;
  code: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
