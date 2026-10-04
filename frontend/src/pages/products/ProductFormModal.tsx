import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useAppDispatch } from '@/app/hooks';
import { errorMessage, isApiError } from '@/api/baseApi';
import { useSaveProductMutation } from '@/api/products';
import type { Product } from '@/api/types';
import Button from '@/components/ui/Button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Field, Input, Textarea } from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import { showToast } from '@/features/ui/uiSlice';
import { useT } from '@/i18n/useT';
import { makeProductSchema, toFormValues, toRequest, type ProductValues } from './productSchema';

// Create (product = null) or edit a product
export default function ProductFormModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { t } = useT();
  const dispatch = useAppDispatch();
  const [save, { isLoading }] = useSaveProductMutation();
  const schema = useMemo(() => makeProductSchema(t), [t]);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProductValues>({
    resolver: yupResolver(schema),
    defaultValues: toFormValues(product),
  });

  const onSubmit = async (values: ProductValues) => {
    const res = await save({ id: product?.id, body: toRequest(values) });
    if (!res.error) {
      dispatch(showToast(product ? t('products.updated') : t('products.created')));
      onClose();
      return;
    }
    // Surface API errors where they belong: duplicate SKU on the field, validation in the form
    const error = res.error;
    if (isApiError(error) && error.code === 'err_duplicate') {
      setError('sku', { message: error.message }, { shouldFocus: true });
    } else if (isApiError(error) && error.code === 'bad_request') {
      setError('root.server', { message: error.message });
    } else {
      dispatch(showToast(errorMessage(error), 'error'));
    }
  };

  return (
    <Modal
      open
      title={product ? t('products.editTitle', { sku: product.sku }) : t('products.newTitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="product-form" loading={isLoading}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form
        id="product-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="grid grid-cols-2 gap-4"
      >
        {errors.root?.server && (
          <p
            role="alert"
            className="tone-danger col-span-2 rounded-xl px-3.5 py-2.5 text-sm ring-1 ring-inset"
          >
            {errors.root.server.message}
          </p>
        )}
        <Field
          label={t('products.sku')}
          required
          error={errors.sku?.message}
          hint={t('products.skuHint')}
          className="col-span-2 sm:col-span-1"
        >
          <Input autoFocus maxLength={50} aria-invalid={!!errors.sku} {...register('sku')} />
        </Field>
        <Field
          label={t('products.name')}
          required
          error={errors.name?.message}
          className="col-span-2 sm:col-span-1"
        >
          <Input maxLength={200} aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        <Field
          label={t('products.price')}
          required
          error={errors.price?.message}
          className="col-span-2 sm:col-span-1"
        >
          <Controller
            control={control}
            name="price"
            render={({ field }) => <CurrencyInput {...field} aria-invalid={!!errors.price} />}
          />
        </Field>
        <Field
          label={t('products.stock')}
          required
          error={errors.stock?.message}
          className="col-span-2 sm:col-span-1"
        >
          <Input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            className="text-right"
            aria-invalid={!!errors.stock}
            {...register('stock', { valueAsNumber: true })}
          />
        </Field>
        <Field
          label={t('products.description')}
          error={errors.description?.message}
          className="col-span-2"
        >
          <Textarea
            rows={3}
            maxLength={500}
            aria-invalid={!!errors.description}
            {...register('description')}
          />
        </Field>
        <label className="col-span-2 flex items-center gap-2.5 text-sm text-ink-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line-strong accent-[rgb(var(--primary))]"
            {...register('is_active')}
          />
          {t('products.isActive')}
        </label>
      </form>
    </Modal>
  );
}
