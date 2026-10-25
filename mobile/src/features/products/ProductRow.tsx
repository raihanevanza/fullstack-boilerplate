import {Badge} from '@rupa-ui/react-native';
import React from 'react';
import {StyleSheet, View} from 'react-native';
import type {Product} from '@/core/api/types';
import {useFormat} from '@/core/format/useFormat';
import {useT} from '@/core/i18n/useT';
import {AppText} from '@/shared/AppText';
import {PressableCard} from '@/shared/PressableCard';
import {isLowStock} from './productForm';

// One product in the list: name + SKU, status badge, stock and price
export function ProductRow({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  const {t} = useT();
  const f = useFormat();
  const low = isLowStock(product);
  const status = product.is_active
    ? t('products.active')
    : t('products.inactive');

  return (
    <PressableCard
      onPress={onPress}
      accessibilityLabel={`${product.name}, ${
        product.sku
      }, ${status}, ${f.currency(product.price)}`}
    >
      <View style={styles.top}>
        <View style={styles.flex}>
          <AppText variant="heading" numberOfLines={1}>
            {product.name}
          </AppText>
          <AppText variant="caption" color="ink3" numberOfLines={1}>
            {product.sku}
          </AppText>
        </View>
        <Badge tone={product.is_active ? 'success' : 'neutral'} dot>
          {status}
        </Badge>
      </View>
      <View style={styles.bottom}>
        <View style={[styles.flex, styles.stock]}>
          <AppText
            variant="caption"
            color={low ? 'danger' : 'ink2'}
            weight="medium"
            numeric
          >
            {t('products.stockCount', {count: f.number(product.stock)})}
          </AppText>
          {low ? (
            <Badge tone="warning" size="sm">
              {t('products.lowStock')}
            </Badge>
          ) : null}
        </View>
        <AppText variant="heading" numeric>
          {f.currency(product.price)}
        </AppText>
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  top: {flexDirection: 'row', alignItems: 'flex-start', gap: 8},
  bottom: {flexDirection: 'row', alignItems: 'center', gap: 8},
  stock: {flexDirection: 'row', alignItems: 'center', gap: 8},
});
