export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface Paginado<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
