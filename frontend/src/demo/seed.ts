// Initial demo data. Same accounts and products as db/init/02_seed_dev.sql, so the demo
// dashboard matches the real dev database (12 total, 10 active, 2 inactive, 3 low stock,
// inventory value 54,355,000).
import { emptyDb, nextId, type DemoDb, type ProductRow } from './store';

const DAY = 86_400_000;

type SeedProduct = [
  sku: string,
  name: string,
  description: string | null,
  price: number,
  stock: number,
  active: boolean,
];

const products: SeedProduct[] = [
  ['PRD-0001', 'Wireless Mouse', '2.4 GHz, silent click', 99_000, 25, true],
  ['PRD-0002', 'Mechanical Keyboard', 'Hot-swappable switches, US layout', 450_000, 8, true],
  ['PRD-0003', 'USB-C Hub 7-in-1', 'HDMI 4K, 3x USB-A, SD, 100 W PD', 275_000, 30, true],
  ['PRD-0004', '27-inch Monitor', 'QHD IPS, 75 Hz', 2_350_000, 6, true],
  ['PRD-0005', 'Laptop Stand', 'Aluminium, adjustable height', 185_000, 40, true],
  ['PRD-0006', 'HD Webcam 1080p', null, 320_000, 15, true],
  ['PRD-0007', 'Noise-Cancelling Headset', 'Bluetooth 5.3, 30 h battery', 650_000, 4, true],
  ['PRD-0008', 'A4 Copy Paper (500 sheets)', '80 gsm', 55_000, 120, true],
  ['PRD-0009', 'Ballpoint Pens (box of 12)', 'Black ink, 0.7 mm', 36_000, 80, true],
  ['PRD-0010', 'Desk Organizer', null, 75_000, 22, true],
  ['PRD-0011', 'Whiteboard Markers (set of 4)', 'Discontinued', 42_000, 0, false],
  ['PRD-0012', 'LED Desk Lamp', 'Dimmable, USB powered', 210_000, 12, false],
];

export function seedDb(now = Date.now()): DemoDb {
  const db = emptyDb();

  db.users.push(
    {
      id: nextId(db, 'users'),
      full_name: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN',
      is_active: true,
      last_login_at: null,
    },
    {
      id: nextId(db, 'users'),
      full_name: 'Staff User',
      email: 'staff@example.com',
      role: 'STAFF',
      is_active: true,
      last_login_at: null,
    },
  );

  // Oldest first, a few hours apart, so "newest first" ordering is visible
  products.forEach(([sku, name, description, price, stock, is_active], i) => {
    const created = new Date(now - (products.length - i) * DAY * 0.6).toISOString();
    const row: ProductRow = {
      id: nextId(db, 'products'),
      sku,
      name,
      description,
      price,
      stock,
      is_active,
      created_at: created,
      updated_at: null,
      deleted_at: null,
    };
    db.products.push(row);
  });

  return db;
}
