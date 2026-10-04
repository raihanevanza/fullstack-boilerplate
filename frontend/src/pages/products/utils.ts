import type { Product } from '@/api/types';
import { LOW_STOCK_THRESHOLD } from '@/lib/config';

// Same rule as the dashboard's low_stock_products: active and stock ≤ threshold
export const isLowStock = (p: Product) => p.is_active && p.stock <= LOW_STOCK_THRESHOLD;
