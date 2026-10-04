// Backend response types, see docs/API.md. Timestamps are RFC 3339 strings in UTC.

export interface ApiErrorBody {
  error_code: string;
  title: string;
  message: string;
}

export interface Envelope<T> {
  error: ApiErrorBody | null;
  message: string | null;
  data: T;
}

export interface Pagination {
  // Total number of matching rows, not the page size
  count: number;
  page: number;
  limit: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

// Known permissions. The role -> permission map lives only in the backend; clients never check roles.
// `string & {}` keeps autocomplete while accepting permissions added later on the server.
export type Permission = 'product.write' | (string & {});

export interface User {
  id: number;
  full_name: string;
  email: string;
  // e.g. "ADMIN" / "STAFF". Display `role_name`, never branch on `role`.
  role: string;
  role_name: string;
  last_login_at: string | null;
  permissions: Permission[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
  user: User;
}

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

export interface ProductListArgs {
  search?: string;
  activeOnly?: boolean;
}

export interface Dashboard {
  total_products: number;
  active_products: number;
  inactive_products: number;
  // Active products with stock <= LOW_STOCK_THRESHOLD (backend)
  low_stock_products: number;
  // Sum of price * stock over active products
  inventory_value: number;
  // Up to 5 products, newest first
  recent_products: Product[];
}
