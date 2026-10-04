import type {Product} from '@/core/api/types';
import {
  DESCRIPTION_MAX,
  EMPTY_FORM,
  hasErrors,
  isLowStock,
  NAME_MAX,
  parsePrice,
  parseStock,
  sanitizePriceInput,
  sanitizeStockInput,
  SKU_MAX,
  toFormValues,
  toProductRequest,
  validateProduct,
  type ProductFormValues,
} from '@/features/products/productForm';

const valid: ProductFormValues = {
  sku: ' PRD-0001 ',
  name: ' Wireless Mouse ',
  description: '  ',
  price: '99000',
  stock: '25',
  isActive: true,
};

describe('validateProduct', () => {
  it('accepts a valid form', () => {
    expect(hasErrors(validateProduct(valid))).toBe(false);
  });

  it('requires sku, name, price and stock', () => {
    const errors = validateProduct(EMPTY_FORM);
    expect(errors.sku?.key).toBe('validation.required');
    expect(errors.name?.key).toBe('validation.required');
    expect(errors.price?.key).toBe('validation.required');
    expect(errors.stock?.key).toBe('validation.required');
    expect(errors.description).toBeUndefined();
  });

  it('enforces the backend max lengths after trimming', () => {
    const errors = validateProduct({
      ...valid,
      sku: 'x'.repeat(SKU_MAX + 1),
      name: 'x'.repeat(NAME_MAX + 1),
      description: 'x'.repeat(DESCRIPTION_MAX + 1),
    });
    expect(errors.sku).toEqual({
      key: 'validation.maxLength',
      params: {max: SKU_MAX},
    });
    expect(errors.name?.params).toEqual({max: NAME_MAX});
    expect(errors.description?.params).toEqual({max: DESCRIPTION_MAX});
    expect(
      hasErrors(validateProduct({...valid, sku: ` ${'x'.repeat(SKU_MAX)} `})),
    ).toBe(false);
  });

  it('rejects malformed price and stock', () => {
    expect(validateProduct({...valid, price: '1.234'}).price?.key).toBe(
      'validation.price',
    );
    expect(validateProduct({...valid, price: '-1'}).price?.key).toBe(
      'validation.price',
    );
    expect(validateProduct({...valid, stock: '2.5'}).stock?.key).toBe(
      'validation.stock',
    );
  });
});

describe('price and stock inputs', () => {
  it('keeps digits and one decimal separator with at most 2 decimals', () => {
    expect(sanitizePriceInput('99000')).toBe('99000');
    expect(sanitizePriceInput('1,5')).toBe('1.5');
    expect(sanitizePriceInput('12.345')).toBe('12.34');
    expect(sanitizePriceInput('1.2.3')).toBe('1.23');
    expect(sanitizePriceInput('.5')).toBe('0.5');
    expect(sanitizePriceInput('Rp 10a')).toBe('10');
  });

  it('parses only valid amounts', () => {
    expect(parsePrice('99000')).toBe(99000);
    expect(parsePrice('0')).toBe(0);
    expect(parsePrice('10.50')).toBe(10.5);
    expect(parsePrice('10.')).toBeNull();
    expect(parsePrice('')).toBeNull();
  });

  it('accepts whole stock numbers only', () => {
    expect(sanitizeStockInput('1a2.3')).toBe('123');
    expect(parseStock('25')).toBe(25);
    expect(parseStock('0')).toBe(0);
    expect(parseStock('-3')).toBeNull();
  });
});

describe('ProductRequest mapping', () => {
  it('trims text and sends an empty description as null', () => {
    expect(toProductRequest(valid)).toEqual({
      sku: 'PRD-0001',
      name: 'Wireless Mouse',
      description: null,
      price: 99000,
      stock: 25,
      is_active: true,
    });
  });

  it('round-trips an existing product', () => {
    const product: Product = {
      id: 1,
      sku: 'PRD-0001',
      name: 'Wireless Mouse',
      description: '2.4 GHz, silent click',
      price: 99000.5,
      stock: 3,
      is_active: false,
      created_at: '2026-10-04T03:00:00Z',
      updated_at: null,
    };
    const values = toFormValues(product);
    expect(values.price).toBe('99000.5');
    expect(toProductRequest(values)).toEqual({
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      is_active: false,
    });
  });
});

describe('isLowStock', () => {
  it('flags active products at or below the threshold', () => {
    expect(isLowStock({stock: 10, is_active: true})).toBe(true);
    expect(isLowStock({stock: 11, is_active: true})).toBe(false);
    expect(isLowStock({stock: 0, is_active: false})).toBe(false);
  });
});
