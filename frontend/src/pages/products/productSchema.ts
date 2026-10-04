import * as yup from 'yup';
import type { Product, ProductRequest } from '@/api/types';
import type { TFunction } from '@/i18n/useT';

// Same rules as the backend (docs/API.md → ProductRequest). Built per language with
// useMemo(() => makeProductSchema(t), [t]) so messages follow the active language.
export const makeProductSchema = (t: TFunction) => {
  const requiredText = (label: string, max: number) =>
    yup
      .string()
      .trim()
      .required(t('v.required', { field: label }))
      .max(max, t('v.maxChars', { max }));

  return yup.object({
    sku: requiredText(t('products.sku'), 50),
    name: requiredText(t('products.name'), 200),
    description: yup
      .string()
      .trim()
      .max(500, t('v.maxChars', { max: 500 }))
      .nullable()
      .defined()
      .transform((v: string | null) => (v === '' ? null : v)),
    price: yup
      .number()
      .typeError(t('v.required', { field: t('products.price') }))
      .required(t('v.required', { field: t('products.price') }))
      .min(0, t('v.min0', { field: t('products.price') })),
    stock: yup
      .number()
      .typeError(t('v.number', { field: t('products.stock') }))
      .required(t('v.required', { field: t('products.stock') }))
      .integer(t('v.integer', { field: t('products.stock') }))
      .min(0, t('v.min0', { field: t('products.stock') })),
    is_active: yup.boolean().required(),
  });
};

export type ProductValues = yup.InferType<ReturnType<typeof makeProductSchema>>;

export const toFormValues = (p?: Product | null): ProductValues => ({
  sku: p?.sku ?? '',
  name: p?.name ?? '',
  description: p?.description ?? null,
  price: p?.price ?? NaN,
  stock: p?.stock ?? 0,
  is_active: p?.is_active ?? true,
});

export const toRequest = (v: ProductValues): ProductRequest => ({
  sku: v.sku,
  name: v.name,
  description: v.description ?? null,
  price: Math.round(v.price * 100) / 100,
  stock: v.stock,
  is_active: v.is_active,
});
