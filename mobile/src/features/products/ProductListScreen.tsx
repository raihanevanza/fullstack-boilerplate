import {Plus} from 'lucide-react-native';
import React, {useEffect, useState} from 'react';
import {FlatList, RefreshControl, StyleSheet, View} from 'react-native';
import type {TabScreenProps} from '@/app/navigation/types';
import {useProductsInfiniteQuery} from '@/core/api/api';
import {useCan} from '@/core/auth/useCan';
import {useT} from '@/core/i18n/useT';
import {useTheme} from '@/core/theme/useTheme';
import {Banner} from '@/shared/Banner';
import {Button} from '@/shared/Button';
import {ListState} from '@/shared/ListState';
import {PageHeader} from '@/shared/PageHeader';
import {Screen} from '@/shared/Screen';
import {SearchBar} from '@/shared/SearchBar';
import {Segmented} from '@/shared/Segmented';
import {useInfiniteList} from '@/shared/useInfiniteList';
import {ProductRow} from './ProductRow';

type Filter = 'all' | 'active';

export function ProductListScreen({
  navigation,
  route,
}: TabScreenProps<'Products'>) {
  const {colors} = useTheme();
  const {t} = useT();
  const canWrite = useCan('product.write');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  // Opened from the home screen with a preset filter
  useEffect(() => {
    if (route.params?.activeOnly !== undefined) {
      setFilter(route.params.activeOnly ? 'active' : 'all');
    }
  }, [route.params]);

  const query = useProductsInfiniteQuery({
    search: search || undefined,
    activeOnly: filter === 'active',
  });
  const list = useInfiniteList(query);

  const header = (
    <View>
      <PageHeader
        title={t('products.title')}
        subtitle={t('products.subtitle')}
        right={
          canWrite ? (
            <Button
              label={t('products.add')}
              icon={<Plus size={18} color="#FFFFFF" />}
              onPress={() => navigation.navigate('ProductForm')}
              style={styles.addButton}
            />
          ) : undefined
        }
      />
      <View style={styles.filters}>
        <SearchBar placeholder={t('products.search')} onSearch={setSearch} />
        <Segmented<Filter>
          accessibilityLabel={t('products.filter')}
          value={filter}
          onChange={setFilter}
          options={[
            {value: 'all', label: t('products.filterAll')},
            {value: 'active', label: t('products.filterActive')},
          ]}
        />
        {list.stale ? <Banner message={t('common.staleData')} /> : null}
      </View>
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={list.items}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={list.refreshing}
            onRefresh={list.onRefresh}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
        onEndReached={list.onEndReached}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <ListState
            loading={query.isLoading}
            error={list.blockingError}
            empty
            emptyText={t('products.empty')}
            onRetry={query.refetch}
          />
        }
        ListFooterComponent={list.footer}
        ItemSeparatorComponent={Separator}
        renderItem={({item}) => (
          <View style={styles.padded}>
            <ProductRow
              product={item}
              onPress={() =>
                navigation.navigate('ProductDetail', {
                  id: item.id,
                  name: item.name,
                })
              }
            />
          </View>
        )}
      />
    </Screen>
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  list: {paddingBottom: 24, flexGrow: 1},
  filters: {gap: 12, paddingHorizontal: 16, paddingBottom: 16},
  padded: {paddingHorizontal: 16},
  separator: {height: 12},
  addButton: {minHeight: 40, paddingHorizontal: 14},
});
