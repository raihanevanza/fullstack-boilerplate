import { yupResolver } from '@hookform/resolvers/yup';
import { Alert, Button, Checkbox, Field, Textarea, TextField, useToast } from '@rupa-ui/react';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { errorMessage, isApiError } from '@/api/baseApi';
import { useSaveProductMutation } from '@/api/products';
import type { Product } from '@/api/types';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import Dialog from '@/components/ui/Dialog';
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
  const toast = useToast();
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
      toast.show({
        tone: 'success',
        title: product ? t('products.updated') : t('products.created'),
      });
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
      toast.show({ tone: 'danger', title: errorMessage(error) });
    }
  };

  const required = t('common.required');

  return (
    <Dialog
      title={product ? t('products.editTitle', { sku: product.sku }) : t('products.newTitle')}
      onClose={onClose}
      // Esc and outside clicks do nothing while saving
      dismissible={!isLoading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" form="product-form" loading={isLoading}>
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
          <Alert tone="danger" live className="col-span-2">
            {errors.root.server.message}
          </Alert>
        )}
        <TextField
          label={t('products.sku')}
          required
          requiredLabel={required}
          error={errors.sku?.message}
          hint={t('products.skuHint')}
          fieldClassName="col-span-2 sm:col-span-1"
          maxLength={50}
          {...register('sku')}
        />
        <TextField
          label={t('products.name')}
          required
          requiredLabel={required}
          error={errors.name?.message}
          fieldClassName="col-span-2 sm:col-span-1"
          maxLength={200}
          {...register('name')}
        />
        <Controller
          control={control}
          name="price"
          render={({ field }) => (
            <CurrencyInput
              label={t('products.price')}
              required
              requiredLabel={required}
              error={errors.price?.message}
              fieldClassName="col-span-2 sm:col-span-1"
              {...field}
            />
          )}
        />
        <TextField
          label={t('products.stock')}
          required
          requiredLabel={required}
          error={errors.stock?.message}
          fieldClassName="col-span-2 sm:col-span-1"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          className="text-right"
          {...register('stock', { valueAsNumber: true })}
        />
        <Field
          label={t('products.description')}
          error={errors.description?.message}
          className="col-span-2"
        >
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              rows={3}
              maxLength={500}
              {...register('description')}
            />
          )}
        </Field>
        <Checkbox
          label={t('products.isActive')}
          className="col-span-2"
          {...register('is_active')}
        />
      </form>
    </Dialog>
  );
}
