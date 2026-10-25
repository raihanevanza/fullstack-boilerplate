import {Alert, Button, Segmented, useTheme} from '@rupa-ui/react-native';
import {Plus} from 'lucide-react-native';
import React, {useEffect, useState} from 'react';
import {FlatList, RefreshControl, StyleSheet, View} from 'react-native';
import type {TabScreenProps} from '@/app/navigation/types';
import {useProductsInfiniteQuery} from '@/core/api/api';
import {useCan} from '@/core/auth/useCan';
import {useT} from '@/core/i18n/useT';
import {ListState} from '@/shared/ListState';
import {PageHeader} from '@/shared/PageHeader';
import {Screen} from '@/shared/Screen';
import {SearchBar} from '@/shared/SearchBar';
import {useInfiniteList} from '@/shared/useInfiniteList';
import {ProductRow} from './ProductRow';

type Filter = 'all' | 'active';

const addIcon = (color: string) => <Plus size={16} color={color} />;

export function ProductListScreen({
  navigation,
  route,
}: TabScreenProps<'Products'>) {
  const {palette} = useTheme();
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
        description={t('products.subtitle')}
        actions={
          canWrite ? (
            <Button
              variant="primary"
              size="sm"
              iconStart={addIcon}
              onPress={() => navigation.navigate('ProductForm')}
            >
              {t('products.add')}
            </Button>
          ) : undefined
        }
      />
      <View style={styles.filters}>
        <SearchBar placeholder={t('products.search')} onSearch={setSearch} />
        <Segmented<Filter>
          label={t('products.filter')}
          block
          value={filter}
          onChange={setFilter}
          options={[
            {value: 'all', label: t('products.filterAll')},
            {value: 'active', label: t('products.filterActive')},
          ]}
        />
        {list.stale ? (
          <Alert tone="warning">{t('common.staleData')}</Alert>
        ) : null}
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
            colors={[palette.accent]}
            tintColor={palette.accent}
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
});
