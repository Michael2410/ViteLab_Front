export interface LoginRequest {
  username: string;
  password: string;
}

export interface SedeAsignada {
  id: number;
  nombre: string;
  codigo: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
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
  created_at: string;
  updated_at: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
