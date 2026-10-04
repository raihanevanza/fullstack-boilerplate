import type {Product, ProductRequest} from '@/core/api/types';
import type {TKey, TParams} from '@/core/i18n/core';

// Same limits as the backend validation (docs/API.md, ProductRequest)
export const SKU_MAX = 50;
export const NAME_MAX = 200;
export const DESCRIPTION_MAX = 500;

// Mirrors LOW_STOCK_THRESHOLD in the backend; only used for the "Low stock" badge
export const LOW_STOCK_THRESHOLD = 10;

export const isLowStock = (product: Pick<Product, 'stock' | 'is_active'>) =>
  product.is_active && product.stock <= LOW_STOCK_THRESHOLD;

// Raw input values. Price and stock stay strings while typing.
export interface ProductFormValues {
  sku: string;
  name: string;
  description: string;
  price: string;
  stock: string;
  isActive: boolean;
}

export type ProductField = 'sku' | 'name' | 'description' | 'price' | 'stock';

export interface FieldError {
  key: TKey;
  params?: TParams;
}

export type ProductFormErrors = Partial<Record<ProductField, FieldError>>;

export const EMPTY_FORM: ProductFormValues = {
  sku: '',
  name: '',
  description: '',
  price: '',
  stock: '',
  isActive: true,
};

export function toFormValues(product: Product): ProductFormValues {
  return {
    sku: product.sku,
    name: product.name,
    description: product.description ?? '',
    price: String(product.price),
    stock: String(product.stock),
    isActive: product.is_active,
  };
}

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
const STOCK_PATTERN = /^\d+$/;

// Keeps a price field typeable: digits and one decimal separator ("," becomes "."), max 2 decimals.
// Grouping separators are never typed; the formatted value is shown as a hint instead.
export function sanitizePriceInput(text: string): string {
  const cleaned = text.replace(/,/g, '.').replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) {
    return cleaned;
  }
  const whole = cleaned.slice(0, dot);
  const decimals = cleaned
    .slice(dot + 1)
    .replace(/\./g, '')
    .slice(0, 2);
  return `${whole || '0'}.${decimals}`;
}

export const sanitizeStockInput = (text: string) => text.replace(/\D/g, '');

// Parsed price, or null when the text is not a valid amount
export function parsePrice(text: string): number | null {
  const value = text.trim();
  return PRICE_PATTERN.test(value) ? Number(value) : null;
}

export function parseStock(text: string): number | null {
  const value = text.trim();
  if (!STOCK_PATTERN.test(value)) {
    return null;
  }
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}

const required: FieldError = {key: 'validation.required'};
const maxLength = (max: number): FieldError => ({
  key: 'validation.maxLength',
  params: {max},
});

export function validateProduct(values: ProductFormValues): ProductFormErrors {
  const errors: ProductFormErrors = {};
  const sku = values.sku.trim();
  const name = values.name.trim();
  const description = values.description.trim();

  if (!sku) {
    errors.sku = required;
  } else if (sku.length > SKU_MAX) {
    errors.sku = maxLength(SKU_MAX);
  }

  if (!name) {
    errors.name = required;
  } else if (name.length > NAME_MAX) {
    errors.name = maxLength(NAME_MAX);
  }

  if (description.length > DESCRIPTION_MAX) {
    errors.description = maxLength(DESCRIPTION_MAX);
  }

  if (!values.price.trim()) {
    errors.price = required;
  } else if (parsePrice(values.price) === null) {
    errors.price = {key: 'validation.price'};
  }

  if (!values.stock.trim()) {
    errors.stock = required;
  } else if (parseStock(values.stock) === null) {
    errors.stock = {key: 'validation.stock'};
  }

  return errors;
}

export const hasErrors = (errors: ProductFormErrors) =>
  Object.values(errors).some(Boolean);

// Call only after validateProduct() returned no errors
export function toProductRequest(values: ProductFormValues): ProductRequest {
  const description = values.description.trim();
  return {
    sku: values.sku.trim(),
    name: values.name.trim(),
    description: description || null,
    price: parsePrice(values.price) ?? 0,
    stock: parseStock(values.stock) ?? 0,
    is_active: values.isActive,
  };
}
