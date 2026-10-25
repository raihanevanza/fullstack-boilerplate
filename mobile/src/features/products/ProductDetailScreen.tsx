import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  InfoList,
  useTheme,
} from '@rupa-ui/react-native';
import {Pencil, Trash2} from 'lucide-react-native';
import React, {useState} from 'react';
import {RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootScreenProps} from '@/app/navigation/types';
import {useDeleteProductMutation, useProductQuery} from '@/core/api/api';
import {errorMessage} from '@/core/api/errorMessage';
import {useCan} from '@/core/auth/useCan';
import {useFormat} from '@/core/format/useFormat';
import {useT} from '@/core/i18n/useT';
import {AppText} from '@/shared/AppText';
import {ListState} from '@/shared/ListState';
import {notify} from '@/shared/notify';
import {PageHeader} from '@/shared/PageHeader';
import {Screen} from '@/shared/Screen';
import {isLowStock} from './productForm';

const editIcon = (color: string) => <Pencil size={18} color={color} />;

export function ProductDetailScreen({
  route,
  navigation,
}: RootScreenProps<'ProductDetail'>) {
  const {id} = route.params;
  const {palette} = useTheme();
  const {t} = useT();
  const f = useFormat();
  const insets = useSafeAreaInsets();
  const canWrite = useCan('product.write');

  // Always re-read on open so edit/delete act on the latest data
  const {
    data: product,
    error,
    isLoading,
    refetch,
  } = useProductQuery(id, {refetchOnMountOrArgChange: true});
  const [deleteProduct, deleteState] = useDeleteProductMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  // Throwing keeps the dialog open with the error; resolving closes it
  const runDelete = async () => {
    try {
      await deleteProduct(id).unwrap();
    } catch (err) {
      throw new Error(errorMessage(err, t));
    }
    notify(t('products.deleted'));
    navigation.goBack();
  };

  const back = {label: t('products.back'), onPress: () => navigation.goBack()};

  if (!product) {
    return (
      <Screen>
        <PageHeader
          title={route.params.name ?? t('products.title')}
          back={back}
        />
        <ListState
          loading={isLoading}
          error={error ?? (isLoading ? null : true)}
          onRetry={refetch}
        />
      </Screen>
    );
  }

  const low = isLowStock(product);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[palette.accent]}
            tintColor={palette.accent}
          />
        }
      >
        <PageHeader
          title={product.name}
          description={product.sku}
          meta={
            <Badge tone={product.is_active ? 'success' : 'neutral'} dot>
              {product.is_active
                ? t('products.active')
                : t('products.inactive')}
            </Badge>
          }
          back={back}
        />
        <View style={styles.body}>
          {error ? <Alert tone="warning">{t('common.staleData')}</Alert> : null}
          {!canWrite ? (
            <Alert tone="info">{t('products.readOnly')}</Alert>
          ) : null}

          <Card title={t('products.details')}>
            <InfoList
              columns={2}
              emptyValue="-"
              items={[
                {label: t('products.sku'), value: product.sku},
                {
                  label: t('products.price'),
                  value: (
                    <AppText weight="bold" numeric>
                      {f.currency(product.price)}
                    </AppText>
                  ),
                },
                {
                  label: t('products.stock'),
                  value: (
                    <View style={styles.stock}>
                      <AppText
                        weight="semibold"
                        numeric
                        color={low ? 'danger' : 'ink'}
                      >
                        {f.number(product.stock)}
                      </AppText>
                      {low ? (
                        <Badge tone="warning" size="sm">
                          {t('products.lowStock')}
                        </Badge>
                      ) : null}
                    </View>
                  ),
                },
                {
                  label: t('products.status'),
                  value: product.is_active
                    ? t('products.active')
                    : t('products.inactive'),
                },
                {
                  label: t('products.created'),
                  value: f.dateTime(product.created_at),
                },
                {
                  label: t('products.updated'),
                  value: f.dateTime(product.updated_at),
                },
              ]}
            />
          </Card>

          <Card title={t('products.description')}>
            <AppText color={product.description ? 'ink' : 'ink3'}>
              {product.description || '-'}
            </AppText>
          </Card>
        </View>
      </ScrollView>

      {canWrite ? (
        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: palette.surface,
              borderTopColor: palette.line,
              paddingBottom: 12 + insets.bottom,
            },
          ]}
        >
          <Button
            variant="secondary"
            iconStart={<Trash2 size={18} color={palette.dangerInk} />}
            onPress={() => setConfirmOpen(true)}
            disabled={deleteState.isLoading}
            style={styles.flex}
          >
            {t('common.delete')}
          </Button>
          <Button
            variant="primary"
            iconStart={editIcon}
            onPress={() => navigation.navigate('ProductForm', {id})}
            disabled={deleteState.isLoading}
            style={styles.flex}
          >
            {t('common.edit')}
          </Button>
        </View>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        tone="danger"
        title={t('products.deleteTitle')}
        description={t('products.deleteDesc')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        errorTitle={t('common.failed')}
        errorMessage={t('common.error')}
        onConfirm={runDelete}
      >
        <View
          style={[
            styles.highlight,
            {backgroundColor: palette.surface2, borderColor: palette.line},
          ]}
        >
          <AppText weight="semibold" numeric>
            {product.sku} · {product.name}
          </AppText>
        </View>
      </ConfirmDialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  content: {paddingBottom: 32},
  body: {paddingHorizontal: 16, gap: 14},
  stock: {flexDirection: 'row', alignItems: 'center', gap: 8},
  highlight: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
