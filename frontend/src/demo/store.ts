// The demo "database": one JSON object kept in the visitor's localStorage.
// Every visitor has their own copy, so it is safe to play with and can be reset at any time.
import type { Permission } from '@/api/types';

export const DEMO_DB_KEY = 'boilerplate-demo-db';
// Bump when the data shape or seed changes → old data in visitors' browsers is re-seeded
const DB_VERSION = 1;

export type Role = 'ADMIN' | 'STAFF';

export interface UserRow {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  last_login_at: string | null;
}

export interface ProductRow {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface AuditRow {
  id: number;
  user_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'product';
  entity_id: number;
  created_at: string;
}

export interface DemoDb {
  version: number;
  ids: Record<string, number>;
  users: UserRow[];
  products: ProductRow[];
  auditLogs: AuditRow[];
}

// Mirrors the role → permission map in the backend (pkg/constantvar)
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ['product.write'],
  STAFF: [],
};

export const ROLE_NAMES: Record<Role, string> = {
  ADMIN: 'Administrator',
  STAFF: 'Staff',
};

export function emptyDb(): DemoDb {
  return { version: DB_VERSION, ids: {}, users: [], products: [], auditLogs: [] };
}

export function nextId(db: DemoDb, table: string): number {
  db.ids[table] = (db.ids[table] ?? 0) + 1;
  return db.ids[table];
}

export function loadDb(seed: () => DemoDb): DemoDb {
  try {
    const raw = localStorage.getItem(DEMO_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoDb;
      if (parsed.version === DB_VERSION) return parsed;
    }
  } catch {
    // Corrupt data or blocked storage → start from the seed
  }
  const fresh = seed();
  saveDb(fresh);
  return fresh;
}

export function saveDb(db: DemoDb) {
  try {
    localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db));
  } catch {
    // Storage full/blocked → data lives in memory while the tab is open
  }
}

export function resetDb() {
  try {
    localStorage.removeItem(DEMO_DB_KEY);
  } catch {
    // ignore
  }
}
