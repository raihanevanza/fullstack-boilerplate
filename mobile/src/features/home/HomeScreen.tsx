import {
  CircleCheck,
  type LucideIcon,
  Package,
  PackageX,
  Wallet,
} from 'lucide-react-native';
import React, {useMemo, useState} from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {useAppSelector} from '@/app/hooks';
import type {TabScreenProps} from '@/app/navigation/types';
import {useDashboardQuery} from '@/core/api/api';
import type {Dashboard, Product} from '@/core/api/types';
import {useFormat} from '@/core/format/useFormat';
import {useT} from '@/core/i18n/useT';
import type {Tone} from '@/core/theme/colors';
import {useTheme} from '@/core/theme/useTheme';
import {isLowStock} from '@/features/products/productForm';
import {AppText} from '@/shared/AppText';
import {Badge} from '@/shared/Badge';
import {Banner} from '@/shared/Banner';
import {Card} from '@/shared/Card';
import {ListState} from '@/shared/ListState';
import {PageHeader} from '@/shared/PageHeader';
import {Screen} from '@/shared/Screen';
import {DonutChart} from './DonutChart';

export function HomeScreen({navigation}: TabScreenProps<'Home'>) {
  const {colors} = useTheme();
  const {t} = useT();
  const f = useFormat();
  const user = useAppSelector(state => state.session.user);
  const {data, error, isLoading, refetch} = useDashboardQuery();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const openProduct = (product: Product) =>
    navigation.navigate('ProductDetail', {id: product.id, name: product.name});

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
          title={t('home.title')}
          subtitle={t('home.welcome', {name: user?.full_name ?? ''})}
        />
        <View style={styles.body}>
          <View
            style={[
              styles.datePill,
              {backgroundColor: colors.surface, borderColor: colors.line},
            ]}
          >
            <AppText variant="label" color="ink2">
              {f.longDate(new Date())}
            </AppText>
          </View>

          {!data ? (
            <ListState loading={isLoading} error={error} onRetry={refetch} />
          ) : (
            <>
              {error ? <Banner message={t('common.staleData')} /> : null}

              <View style={styles.grid}>
                <StatTile
                  icon={Package}
                  tone="brand"
                  label={t('home.totalProducts')}
                  value={f.number(data.total_products)}
                  caption={t('home.totalProductsHint', {
                    count: f.number(data.inactive_products),
                  })}
                  onPress={() =>
                    navigation.navigate('Products', {activeOnly: false})
                  }
                />
                <StatTile
                  icon={CircleCheck}
                  tone="success"
                  label={t('home.activeProducts')}
                  value={f.number(data.active_products)}
                  caption={t('home.activeProductsHint')}
                  onPress={() =>
                    navigation.navigate('Products', {activeOnly: true})
                  }
                />
                <StatTile
                  icon={PackageX}
                  tone="warning"
                  label={t('home.lowStock')}
                  value={f.number(data.low_stock_products)}
                  caption={t('home.lowStockHint')}
                />
                <StatTile
                  icon={Wallet}
                  tone="info"
                  label={t('home.inventoryValue')}
                  value={f.currencyCompact(data.inventory_value)}
                  caption={t('home.inventoryValueHint')}
                />
              </View>

              <StatusCard data={data} />

              <Card
                title={t('home.recent')}
                actions={
                  <Pressable
                    accessibilityRole="link"
                    hitSlop={8}
                    onPress={() => navigation.navigate('Products')}
                  >
                    <AppText variant="label" color="accent" weight="semibold">
                      {t('common.viewAll')}
                    </AppText>
                  </Pressable>
                }
              >
                {data.recent_products.length ? (
                  <View style={styles.recent}>
                    {data.recent_products.map(product => (
                      <RecentRow
                        key={product.id}
                        product={product}
                        onPress={() => openProduct(product)}
                      />
                    ))}
                  </View>
                ) : (
                  <AppText color="ink3">{t('home.noProducts')}</AppText>
                )}
              </Card>
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

// Every product falls in exactly one slice, so the slices add up to total_products
function StatusCard({data}: {data: Dashboard}) {
  const {colors} = useTheme();
  const {t} = useT();
  const f = useFormat();

  const slices = useMemo(
    () => [
      {
        label: t('home.inStock'),
        value: Math.max(0, data.active_products - data.low_stock_products),
        color: colors.series[0],
      },
      {
        label: t('home.lowStockSlice'),
        value: data.low_stock_products,
        color: colors.series[2],
      },
      {
        label: t('home.inactive'),
        value: data.inactive_products,
        color: colors.seriesOther,
      },
    ],
    [data, colors, t],
  );

  return (
    <Card title={t('home.statusTitle')} subtitle={t('home.statusSubtitle')}>
      {data.total_products ? (
        <DonutChart
          slices={slices}
          formatValue={f.number}
          formatCenter={f.compact}
          centerLabel={t('home.centerLabel')}
        />
      ) : (
        <AppText color="ink3">{t('home.noProducts')}</AppText>
      )}
    </Card>
  );
}

function RecentRow({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  const {colors} = useTheme();
  const {t} = useT();
  const f = useFormat();
  const low = isLowStock(product);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${product.sku}, ${f.currency(
        product.price,
      )}`}
      onPress={onPress}
      style={({pressed}) => [
        styles.recentRow,
        pressed && {backgroundColor: colors.surface3},
      ]}
    >
      <View style={styles.flex}>
        <AppText weight="semibold" numberOfLines={1}>
          {product.name}
        </AppText>
        <AppText variant="caption" color="ink3" numberOfLines={1}>
          {product.sku} · {t('products.stockCount', {count: product.stock})}
        </AppText>
      </View>
      <View style={styles.recentRight}>
        <AppText weight="semibold" numeric>
          {f.currency(product.price)}
        </AppText>
        {!product.is_active ? (
          <Badge label={t('products.inactive')} tone="neutral" />
        ) : low ? (
          <Badge label={t('products.lowStock')} tone="warning" />
        ) : null}
      </View>
    </Pressable>
  );
}

interface StatTileProps {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  value: string;
  caption: string;
  onPress?: () => void;
}

// Same as the web StatTile: icon in a ringed square next to the label, big value, small caption
function StatTile({
  icon: Icon,
  tone,
  label,
  value,
  caption,
  onPress,
}: StatTileProps) {
  const {tones} = useTheme();
  const c = tones[tone];
  return (
    <Card
      style={styles.tile}
      onPress={onPress}
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={styles.tileHead}>
        <View
          style={[
            styles.tileIcon,
            {backgroundColor: c.bg, borderColor: c.border},
          ]}
        >
          <Icon size={17} color={c.fg} />
        </View>
        <AppText
          variant="label"
          color="ink2"
          style={styles.flex}
          numberOfLines={2}
        >
          {label}
        </AppText>
      </View>
      <AppText
        variant="hero"
        numeric
        numberOfLines={1}
        adjustsFontSizeToFit
        style={styles.tileValue}
      >
        {value}
      </AppText>
      <AppText variant="caption" color="ink3" numberOfLines={2}>
        {caption}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  content: {paddingBottom: 32},
  body: {paddingHorizontal: 16, gap: 14},
  datePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: -4,
  },
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  tile: {flexBasis: '46%', flexGrow: 1, padding: 16},
  tileHead: {flexDirection: 'row', alignItems: 'center', gap: 10},
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileValue: {marginTop: 14, marginBottom: 6},
  recent: {gap: 2, marginHorizontal: -8},
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  recentRight: {alignItems: 'flex-end', gap: 4},
});
