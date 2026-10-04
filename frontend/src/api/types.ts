// Response types of the backend API. Keep in sync with docs/API.md.

// Normalized error returned by every RTK Query endpoint (see baseApi.ts)
export interface ApiError {
  status: number;
  code: ApiErrorCode | 'network_error';
  title: string;
  message: string;
}

export type ApiErrorCode =
  | 'bad_request'
  | 'err_invalid_credential'
  | 'err_unauthorized'
  | 'err_forbidden'
  | 'err_user_inactive'
  | 'err_not_found'
  | 'err_duplicate'
  | 'internal_server_error';

export interface ApiEnvelope<T> {
  error: { error_code: ApiErrorCode; title: string; message: string } | null;
  message: string | null;
  data: T;
}

export interface Paginated<T> {
  data: T[];
  pagination: { count: number; page: number; limit: number };
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

// ---------- Auth ----------
// Permissions come from /api/auth/me. Never derive them from the role on the client.
export type Permission = 'product.write';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  role_name: string;
  last_login_at: string | null;
  permissions: Permission[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
  user: User;
}

// ---------- Products ----------
export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ProductRequest {
  sku: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  is_active: boolean;
}

export interface ProductListParams extends ListParams {
  active_only?: boolean | string;
}

// ---------- Dashboard ----------
export interface Dashboard {
  total_products: number;
  active_products: number;
  inactive_products: number;
  low_stock_products: number;
  inventory_value: number;
  recent_products: Product[];
}
