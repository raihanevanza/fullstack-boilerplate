import {
  Alert,
  Badge,
  Card,
  useTheme,
  type BadgeTone,
} from '@rupa-ui/react-native';
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
import {isLowStock} from '@/features/products/productForm';
import {AppText} from '@/shared/AppText';
import {ListState} from '@/shared/ListState';
import {PageHeader} from '@/shared/PageHeader';
import {PressableCard} from '@/shared/PressableCard';
import {Screen} from '@/shared/Screen';
import {DonutChart} from './DonutChart';

export function HomeScreen({navigation}: TabScreenProps<'Home'>) {
  const {palette} = useTheme();
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
            colors={[palette.accent]}
            tintColor={palette.accent}
          />
        }
      >
        <PageHeader
          title={t('home.title')}
          description={t('home.welcome', {name: user?.full_name ?? ''})}
        />
        <View style={styles.body}>
          <View
            style={[
              styles.datePill,
              {backgroundColor: palette.surface, borderColor: palette.line},
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
              {error ? (
                <Alert tone="warning">{t('common.staleData')}</Alert>
              ) : null}

              <View style={styles.grid}>
                <StatTile
                  icon={Package}
                  tone="accent"
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
  const {palette} = useTheme();
  const {t} = useT();
  const f = useFormat();

  const slices = useMemo(
    () => [
      {
        label: t('home.inStock'),
        value: Math.max(0, data.active_products - data.low_stock_products),
        color: palette.series[0],
      },
      {
        label: t('home.lowStockSlice'),
        value: data.low_stock_products,
        color: palette.series[2],
      },
      {
        label: t('home.inactive'),
        value: data.inactive_products,
        color: palette.seriesOther,
      },
    ],
    [data, palette, t],
  );

  return (
    <Card title={t('home.statusTitle')} description={t('home.statusSubtitle')}>
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
  const {palette} = useTheme();
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
        pressed && {backgroundColor: palette.surface3},
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
          <Badge tone="neutral" dot size="sm">
            {t('products.inactive')}
          </Badge>
        ) : low ? (
          <Badge tone="warning" dot size="sm">
            {t('products.lowStock')}
          </Badge>
        ) : null}
      </View>
    </Pressable>
  );
}

interface StatTileProps {
  icon: LucideIcon;
  tone: BadgeTone;
  label: string;
  value: string;
  caption: string;
  onPress?: () => void;
}

// Icon tile colors per tone, from the Rupa palette
const tileColors = (
  p: ReturnType<typeof useTheme>['palette'],
  tone: BadgeTone,
) =>
  ({
    neutral: {bg: p.surface3, fg: p.ink2},
    accent: {bg: p.accentSoft, fg: p.accent},
    info: {bg: p.infoSoft, fg: p.infoInk},
    success: {bg: p.successSoft, fg: p.successInk},
    warning: {bg: p.warningSoft, fg: p.warningInk},
    danger: {bg: p.dangerSoft, fg: p.dangerInk},
  }[tone]);

// Same as the web StatTile: icon in a tinted square next to the label, big value, small caption
function StatTile({
  icon: Icon,
  tone,
  label,
  value,
  caption,
  onPress,
}: StatTileProps) {
  const {palette} = useTheme();
  const c = tileColors(palette, tone);
  return (
    <PressableCard
      style={styles.tile}
      padding="sm"
      onPress={onPress}
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={styles.tileHead}>
        <View style={[styles.tileIcon, {backgroundColor: c.bg}]}>
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
      <View style={styles.tileBody}>
        <AppText variant="hero" numeric numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </AppText>
        <AppText variant="caption" color="ink3" numberOfLines={2}>
          {caption}
        </AppText>
      </View>
    </PressableCard>
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
  tile: {flexBasis: '46%', flexGrow: 1},
  tileHead: {flexDirection: 'row', alignItems: 'center', gap: 10},
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBody: {gap: 4},
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
