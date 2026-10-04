// Mock backend for demo mode. It accepts the same requests as the real API (docs/API.md)
// and returns the same { error, message, data } envelope, status codes and error codes.
import type { ApiErrorCode, Dashboard, Permission, Product, User } from '@/api/types';
import type { Lang } from '@/i18n/core';
import { LOW_STOCK_THRESHOLD } from '@/lib/config';
import { errorText, type Detail } from './messages';
import { seedDb } from './seed';
import {
  ROLE_NAMES,
  ROLE_PERMISSIONS,
  loadDb,
  nextId,
  saveDb,
  type DemoDb,
  type ProductRow,
  type UserRow,
} from './store';

export interface DemoRequest {
  method: string;
  url: string;
  params?: Record<string, unknown>;
  data?: unknown;
  token: string | null;
  lang: Lang;
}

export interface DemoResponse {
  status: number;
  body: unknown;
}

class DemoError extends Error {
  constructor(
    public status: number,
    public code: ApiErrorCode,
    public detail?: Detail,
  ) {
    super(code);
  }
}

const DEMO_PASSWORD = 'Password123!';
const TOKEN_PREFIX = 'demo-token-';
const TOKEN_TTL = 8 * 3_600_000;

let db: DemoDb | null = null;
const getDb = () => (db ??= loadDb(() => seedDb()));

// ---------------------------------------------------------------- mappers

const userResponse = (u: UserRow): User => ({
  id: u.id,
  full_name: u.full_name,
  email: u.email,
  role: u.role,
  role_name: ROLE_NAMES[u.role],
  last_login_at: u.last_login_at,
  permissions: ROLE_PERMISSIONS[u.role],
});

const productResponse = ({ deleted_at: _, ...p }: ProductRow): Product => p;

const alive = (d: DemoDb) => d.products.filter((p) => !p.deleted_at);
const newestFirst = (a: ProductRow, b: ProductRow) =>
  b.created_at.localeCompare(a.created_at) || b.id - a.id;
const money = (v: number) => Math.round(v * 100) / 100;

// ---------------------------------------------------------------- validation

const bad = (detail: Detail) => new DemoError(400, 'bad_request', detail);

function text(body: Record<string, unknown>, field: string, max: number, required: boolean) {
  const raw = body[field];
  if (raw === undefined || raw === null || raw === '') {
    if (required) throw bad({ key: 'required', vars: { Field: field } });
    return null;
  }
  if (typeof raw !== 'string') throw bad({ key: 'type', vars: { Field: field } });
  const value = raw.trim();
  if (required && !value) throw bad({ key: 'required', vars: { Field: field } });
  if (value.length > max) throw bad({ key: 'max_string', vars: { Field: field, Param: max } });
  return value || null;
}

function number(body: Record<string, unknown>, field: string, integer: boolean) {
  const raw = body[field];
  if (raw === undefined || raw === null) throw bad({ key: 'required', vars: { Field: field } });
  if (typeof raw !== 'number' || !Number.isFinite(raw) || (integer && !Number.isInteger(raw))) {
    throw bad({ key: 'type', vars: { Field: field } });
  }
  if (raw < 0) throw bad({ key: 'gte', vars: { Field: field, Param: 0 } });
  return raw;
}

function productInput(body: Record<string, unknown>) {
  const isActive = body.is_active;
  if (isActive !== undefined && isActive !== null && typeof isActive !== 'boolean') {
    throw bad({ key: 'type', vars: { Field: 'is_active' } });
  }
  return {
    sku: text(body, 'sku', 50, true) as string,
    name: text(body, 'name', 200, true) as string,
    description: text(body, 'description', 500, false),
    price: money(number(body, 'price', false)),
    stock: number(body, 'stock', true),
    is_active: typeof isActive === 'boolean' ? isActive : true,
  };
}

function checkUniqueSku(d: DemoDb, sku: string, id?: number) {
  const clash = alive(d).some((p) => p.id !== id && p.sku.toLowerCase() === sku.toLowerCase());
  if (clash)
    throw new DemoError(409, 'err_duplicate', { key: 'duplicate_sku', vars: { Sku: sku } });
}

function findProduct(d: DemoDb, rawId: string) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) throw bad({ key: 'invalid_id', vars: {} });
  const row = alive(d).find((p) => p.id === id);
  if (!row) throw new DemoError(404, 'err_not_found');
  return row;
}

function audit(
  d: DemoDb,
  user: UserRow,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  id: number,
  now: string,
) {
  d.auditLogs.push({
    id: nextId(d, 'auditLogs'),
    user_id: user.id,
    action,
    entity: 'product',
    entity_id: id,
    created_at: now,
  });
}

// ---------------------------------------------------------------- handlers

function dashboard(d: DemoDb): Dashboard {
  const rows = alive(d);
  const active = rows.filter((p) => p.is_active);
  return {
    total_products: rows.length,
    active_products: active.length,
    inactive_products: rows.length - active.length,
    low_stock_products: active.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length,
    inventory_value: money(active.reduce((sum, p) => sum + p.price * p.stock, 0)),
    recent_products: [...rows].sort(newestFirst).slice(0, 5).map(productResponse),
  };
}

function listProducts(d: DemoDb, params: Record<string, unknown>) {
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const limit = Math.min(100, Math.max(1, Math.floor(Number(params.limit)) || 20));
  const search = String(params.search ?? '')
    .trim()
    .toLowerCase();
  if (search.length > 100) throw bad({ key: 'max_string', vars: { Field: 'search', Param: 100 } });
  const activeOnly = params.active_only === true || params.active_only === 'true';

  const rows = alive(d)
    .filter((p) => !activeOnly || p.is_active)
    .filter(
      (p) =>
        !search || p.sku.toLowerCase().includes(search) || p.name.toLowerCase().includes(search),
    )
    .sort(newestFirst);
  return {
    data: rows.slice((page - 1) * limit, page * limit).map(productResponse),
    pagination: { count: rows.length, page, limit },
  };
}

function authenticate(d: DemoDb, token: string | null): UserRow {
  const [id, expires] = token?.startsWith(TOKEN_PREFIX)
    ? token.slice(TOKEN_PREFIX.length).split('.').map(Number)
    : [0, 0];
  const user = d.users.find((u) => u.id === id);
  if (!user || !(expires > Date.now())) throw new DemoError(401, 'err_unauthorized');
  if (!user.is_active) throw new DemoError(403, 'err_user_inactive');
  return user;
}

function requirePermission(user: UserRow, permission: Permission) {
  if (!ROLE_PERMISSIONS[user.role].includes(permission)) throw new DemoError(403, 'err_forbidden');
}

// Returns [status, data]
function route(d: DemoDb, req: DemoRequest): [number, unknown] {
  const now = new Date().toISOString();
  const params = req.params ?? {};
  const body = (req.data && typeof req.data === 'object' ? req.data : {}) as Record<
    string,
    unknown
  >;
  const path = req.url.replace(/^\/+/, '').replace(/\?.*$/, '').split('/');
  const method = req.method.toUpperCase();

  if (path[0] === 'auth' && path[1] === 'login' && method === 'POST') {
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase();
    const user = d.users.find((u) => u.email === email);
    if (!user || body.password !== DEMO_PASSWORD) {
      throw new DemoError(401, 'err_invalid_credential');
    }
    if (!user.is_active) throw new DemoError(403, 'err_user_inactive');
    user.last_login_at = now;
    const expires = Date.now() + TOKEN_TTL;
    return [
      200,
      {
        access_token: `${TOKEN_PREFIX}${user.id}.${expires}`,
        token_type: 'Bearer',
        expires_at: new Date(expires).toISOString(),
        user: userResponse(user),
      },
    ];
  }

  const actor = authenticate(d, req.token);

  if (path[0] === 'auth' && path[1] === 'me' && method === 'GET') return [200, userResponse(actor)];
  if (path[0] === 'dashboard' && method === 'GET') return [200, dashboard(d)];

  if (path[0] === 'products' && path.length <= 2) {
    const id = path[1];
    if (method === 'GET') {
      return [200, id ? productResponse(findProduct(d, id)) : listProducts(d, params)];
    }

    requirePermission(actor, 'product.write');
    if (method === 'POST' && !id) {
      const input = productInput(body);
      checkUniqueSku(d, input.sku);
      const row: ProductRow = {
        id: nextId(d, 'products'),
        ...input,
        created_at: now,
        updated_at: null,
        deleted_at: null,
      };
      d.products.push(row);
      audit(d, actor, 'CREATE', row.id, now);
      return [201, productResponse(row)];
    }
    if (method === 'PUT' && id) {
      const row = findProduct(d, id);
      const input = productInput(body);
      checkUniqueSku(d, input.sku, row.id);
      Object.assign(row, input, { updated_at: now });
      audit(d, actor, 'UPDATE', row.id, now);
      return [200, productResponse(row)];
    }
    if (method === 'DELETE' && id) {
      const row = findProduct(d, id);
      // Soft delete
      row.deleted_at = now;
      audit(d, actor, 'DELETE', row.id, now);
      return [200, null];
    }
  }

  throw new DemoError(404, 'err_not_found');
}

export function handle(req: DemoRequest): DemoResponse {
  const current = getDb();
  // Work on a copy: if the request fails halfway, nothing is persisted (like a rollback)
  const draft = structuredClone(current);
  try {
    const [status, data] = route(draft, req);
    if (req.method.toUpperCase() !== 'GET') {
      db = draft;
      saveDb(draft);
    }
    return { status, body: { error: null, message: 'success', data } };
  } catch (err) {
    if (!(err instanceof DemoError)) throw err;
    const { title, message } = errorText(err.code, req.lang, err.detail);
    return {
      status: err.status,
      body: { error: { error_code: err.code, title, message }, message: null, data: null },
    };
  }
}
