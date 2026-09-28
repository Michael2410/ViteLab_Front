export interface Proveedor {
  id: number;
  ruc?: string | null;
  razon_social: string;
  nombre_comercial?: string | null;
  direccion?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  activo: boolean;
  legacy_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListarProveedoresParams {
  page?: number;
  limit?: number;
  search?: string;
  activo?: boolean;
}

export interface ProveedorFormValues {
  ruc?: string;
  razon_social: string;
  nombre_comercial?: string;
  direccion?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
}
