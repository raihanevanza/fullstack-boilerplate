import {Pencil, Trash2} from 'lucide-react-native';
import React, {useState} from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootScreenProps} from '@/app/navigation/types';
import {useDeleteProductMutation, useProductQuery} from '@/core/api/api';
import {errorMessage} from '@/core/api/errorMessage';
import {useCan} from '@/core/auth/useCan';
import {useFormat} from '@/core/format/useFormat';
import {useT} from '@/core/i18n/useT';
import {useTheme} from '@/core/theme/useTheme';
import {AppText} from '@/shared/AppText';
import {Badge} from '@/shared/Badge';
import {Banner} from '@/shared/Banner';
import {Button} from '@/shared/Button';
import {Card} from '@/shared/Card';
import {ConfirmDialog} from '@/shared/ConfirmDialog';
import {InfoList} from '@/shared/InfoList';
import {ListState} from '@/shared/ListState';
import {notify} from '@/shared/notify';
import {PageHeader} from '@/shared/PageHeader';
import {Screen} from '@/shared/Screen';
import {isLowStock} from './productForm';

export function ProductDetailScreen({
  route,
  navigation,
}: RootScreenProps<'ProductDetail'>) {
  const {id} = route.params;
  const {colors, tones} = useTheme();
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

  const runDelete = async () => {
    setConfirmOpen(false);
    try {
      await deleteProduct(id).unwrap();
      notify(t('products.deleted'));
      navigation.goBack();
    } catch (err) {
      Alert.alert(t('common.error'), errorMessage(err, t));
    }
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
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        <PageHeader
          title={product.name}
          subtitle={product.sku}
          badge={
            <Badge
              label={
                product.is_active
                  ? t('products.active')
                  : t('products.inactive')
              }
              tone={product.is_active ? 'success' : 'neutral'}
            />
          }
          back={back}
        />
        <View style={styles.body}>
          {error ? <Banner message={t('common.staleData')} /> : null}
          {!canWrite ? (
            <Banner message={t('products.readOnly')} tone="info" />
          ) : null}

          <Card title={t('products.details')}>
            <InfoList
              items={[
                [t('products.sku'), product.sku],
                [
                  t('products.price'),
                  <AppText weight="bold" numeric>
                    {f.currency(product.price)}
                  </AppText>,
                ],
                [
                  t('products.stock'),
                  <View style={styles.stock}>
                    <AppText
                      weight="semibold"
                      numeric
                      color={low ? 'danger' : 'ink'}
                    >
                      {f.number(product.stock)}
                    </AppText>
                    {low ? (
                      <Badge
                        label={t('products.lowStock')}
                        tone="warning"
                        dot={false}
                      />
                    ) : null}
                  </View>,
                ],
                [
                  t('products.status'),
                  product.is_active
                    ? t('products.active')
                    : t('products.inactive'),
                ],
                [t('products.created'), f.dateTime(product.created_at)],
                [t('products.updated'), f.dateTime(product.updated_at)],
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
              backgroundColor: colors.surface,
              borderTopColor: colors.line,
              paddingBottom: 12 + insets.bottom,
            },
          ]}
        >
          <Button
            label={t('common.delete')}
            variant="secondary"
            icon={<Trash2 size={18} color={tones.danger.fg} />}
            onPress={() => setConfirmOpen(true)}
            loading={deleteState.isLoading}
            style={styles.flex}
          />
          <Button
            label={t('common.edit')}
            icon={<Pencil size={18} color="#FFFFFF" />}
            onPress={() => navigation.navigate('ProductForm', {id})}
            disabled={deleteState.isLoading}
            style={styles.flex}
          />
        </View>
      ) : null}

      <ConfirmDialog
        visible={confirmOpen}
        title={t('products.deleteTitle')}
        highlight={`${product.sku} · ${product.name}`}
        description={t('products.deleteDesc')}
        confirmLabel={t('common.delete')}
        confirmVariant="danger"
        onConfirm={runDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  content: {paddingBottom: 32},
  body: {paddingHorizontal: 16, gap: 14},
  stock: {flexDirection: 'row', alignItems: 'center', gap: 8},
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
