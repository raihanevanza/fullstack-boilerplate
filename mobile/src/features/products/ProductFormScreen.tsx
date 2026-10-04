import React, {useEffect, useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootScreenProps} from '@/app/navigation/types';
import {
  useCreateProductMutation,
  useProductQuery,
  useUpdateProductMutation,
} from '@/core/api/api';
import {errorCode, errorMessage} from '@/core/api/errorMessage';
import {ERR_DUPLICATE} from '@/core/api/http';
import {useCan} from '@/core/auth/useCan';
import {useFormat} from '@/core/format/useFormat';
import {useT} from '@/core/i18n/useT';
import {useTheme} from '@/core/theme/useTheme';
import {AppText} from '@/shared/AppText';
import {Banner} from '@/shared/Banner';
import {Button} from '@/shared/Button';
import {Card} from '@/shared/Card';
import {ChipGroup} from '@/shared/ChipGroup';
import {ListState} from '@/shared/ListState';
import {notify} from '@/shared/notify';
import {PageHeader} from '@/shared/PageHeader';
import {Screen} from '@/shared/Screen';
import {TextField} from '@/shared/TextField';
import {
  DESCRIPTION_MAX,
  EMPTY_FORM,
  hasErrors,
  NAME_MAX,
  parsePrice,
  sanitizePriceInput,
  sanitizeStockInput,
  SKU_MAX,
  toFormValues,
  toProductRequest,
  validateProduct,
  type FieldError,
  type ProductField,
  type ProductFormErrors,
  type ProductFormValues,
} from './productForm';

type InputRef = React.ComponentRef<typeof TextInput>;

export function ProductFormScreen({
  route,
  navigation,
}: RootScreenProps<'ProductForm'>) {
  const id = route.params?.id;
  const editing = id !== undefined;
  const {colors} = useTheme();
  const {t} = useT();
  const f = useFormat();
  const insets = useSafeAreaInsets();
  const canWrite = useCan('product.write');

  const existing = useProductQuery(id ?? 0, {skip: !editing});
  const [createProduct, createState] = useCreateProductMutation();
  const [updateProduct, updateState] = useUpdateProductMutation();
  const saving = createState.isLoading || updateState.isLoading;

  const [values, setValues] = useState<ProductFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  // Prefill once when editing; later refetches must not overwrite what the user typed
  const prefilled = useRef(false);

  const nameRef = useRef<InputRef>(null);
  const descriptionRef = useRef<InputRef>(null);
  const priceRef = useRef<InputRef>(null);
  const stockRef = useRef<InputRef>(null);

  useEffect(() => {
    if (existing.data && !prefilled.current) {
      prefilled.current = true;
      setValues(toFormValues(existing.data));
    }
  }, [existing.data]);

  const set =
    <K extends keyof ProductFormValues>(key: K) =>
    (value: ProductFormValues[K]) => {
      setValues(prev => ({...prev, [key]: value}));
      if (key in errors) {
        setErrors(prev => ({...prev, [key]: undefined}));
      }
    };

  const fieldError = (field: ProductField) => {
    const e: FieldError | undefined = errors[field];
    return e ? t(e.key, e.params) : null;
  };

  const submit = async () => {
    if (saving) {
      return;
    }
    const found = validateProduct(values);
    setErrors(found);
    setFormError(null);
    if (hasErrors(found)) {
      return;
    }

    const body = toProductRequest(values);
    try {
      if (editing) {
        await updateProduct({id, body}).unwrap();
        notify(t('products.updated.toast'));
        navigation.goBack();
      } else {
        const created = await createProduct(body).unwrap();
        notify(t('products.created.toast'));
        navigation.replace('ProductDetail', {
          id: created.id,
          name: created.name,
        });
      }
    } catch (err) {
      // A duplicate SKU belongs to the SKU field; anything else is shown above the form
      if (errorCode(err) === ERR_DUPLICATE) {
        setErrors(prev => ({...prev, sku: {key: 'validation.duplicate'}}));
      } else {
        setFormError(errorMessage(err, t));
      }
    }
  };

  const title = editing ? t('products.editTitle') : t('products.createTitle');
  const back = {label: t('common.cancel'), onPress: () => navigation.goBack()};

  if (!canWrite) {
    return (
      <Screen>
        <PageHeader title={title} back={back} />
        <View style={styles.body}>
          <Banner message={t('products.noPermission')} tone="danger" />
        </View>
      </Screen>
    );
  }

  if (editing && !existing.data) {
    return (
      <Screen>
        <PageHeader title={title} back={back} />
        <ListState
          loading={existing.isLoading}
          error={existing.error ?? (existing.isLoading ? null : true)}
          onRetry={existing.refetch}
        />
      </Screen>
    );
  }

  const price = parsePrice(values.price);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <PageHeader
            title={title}
            subtitle={t('products.formSubtitle')}
            back={back}
          />
          <View style={styles.body}>
            {formError ? <Banner message={formError} tone="danger" /> : null}

            <Card>
              <View style={styles.fields}>
                <TextField
                  label={`${t('products.sku')} *`}
                  value={values.sku}
                  onChangeText={set('sku')}
                  error={fieldError('sku')}
                  placeholder={t('products.skuPlaceholder')}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={SKU_MAX}
                  returnKeyType="next"
                  onSubmitEditing={() => nameRef.current?.focus()}
                  editable={!saving}
                />
                <TextField
                  ref={nameRef}
                  label={`${t('products.name')} *`}
                  value={values.name}
                  onChangeText={set('name')}
                  error={fieldError('name')}
                  placeholder={t('products.namePlaceholder')}
                  maxLength={NAME_MAX}
                  returnKeyType="next"
                  onSubmitEditing={() => priceRef.current?.focus()}
                  editable={!saving}
                />
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <TextField
                      ref={priceRef}
                      label={`${t('products.price')} *`}
                      value={values.price}
                      onChangeText={text =>
                        set('price')(sanitizePriceInput(text))
                      }
                      error={fieldError('price')}
                      hint={
                        price !== null
                          ? t('products.priceHint', {value: f.currency(price)})
                          : undefined
                      }
                      placeholder="0"
                      keyboardType="decimal-pad"
                      returnKeyType="next"
                      onSubmitEditing={() => stockRef.current?.focus()}
                      editable={!saving}
                    />
                  </View>
                  <View style={styles.flex}>
                    <TextField
                      ref={stockRef}
                      label={`${t('products.stock')} *`}
                      value={values.stock}
                      onChangeText={text =>
                        set('stock')(sanitizeStockInput(text))
                      }
                      error={fieldError('stock')}
                      placeholder="0"
                      keyboardType="number-pad"
                      returnKeyType="next"
                      onSubmitEditing={() => descriptionRef.current?.focus()}
                      editable={!saving}
                    />
                  </View>
                </View>
                <TextField
                  ref={descriptionRef}
                  label={t('products.description')}
                  value={values.description}
                  onChangeText={set('description')}
                  error={fieldError('description')}
                  hint={`${values.description.length}/${DESCRIPTION_MAX}`}
                  placeholder={t('products.descriptionPlaceholder')}
                  maxLength={DESCRIPTION_MAX}
                  multiline
                  editable={!saving}
                />
                <View style={styles.status}>
                  <AppText variant="label" color="ink2">
                    {t('products.status')}
                  </AppText>
                  <View style={styles.chips}>
                    <ChipGroup<'active' | 'inactive'>
                      scroll={false}
                      value={values.isActive ? 'active' : 'inactive'}
                      onChange={value => set('isActive')(value === 'active')}
                      options={[
                        {value: 'active', label: t('products.active')},
                        {value: 'inactive', label: t('products.inactive')},
                      ]}
                    />
                  </View>
                </View>
              </View>
            </Card>
          </View>
        </ScrollView>

        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.line,
              paddingBottom: 12 + insets.bottom,
            },
          ]}
        >
          <Button
            label={t('common.cancel')}
            variant="secondary"
            onPress={() => navigation.goBack()}
            disabled={saving}
            style={styles.flex}
          />
          <Button
            label={t('common.save')}
            onPress={submit}
            loading={saving}
            style={styles.flex}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  content: {paddingBottom: 32},
  body: {paddingHorizontal: 16, gap: 14},
  fields: {gap: 16},
  row: {flexDirection: 'row', gap: 12, alignItems: 'flex-start'},
  status: {gap: 8},
  chips: {flexDirection: 'row', gap: 8},
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
