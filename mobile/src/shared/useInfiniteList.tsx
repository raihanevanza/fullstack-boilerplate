import {Spinner} from '@rupa-ui/react-native';
import React, {useCallback, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import type {Paginated} from '@/core/api/types';

// The part of a useXxxInfiniteQuery (RTK Query) result that paginated lists need
interface InfiniteResult<T> {
  data?: {pages: Paginated<T>[]};
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => unknown;
  refetch: () => unknown;
}

// Consistent list behavior: merged pages, pull-to-refresh, load next page, loading footer
export function useInfiniteList<T>(result: InfiniteResult<T>) {
  const [refreshing, setRefreshing] = useState(false);
  const {data, hasNextPage, isFetchingNextPage, fetchNextPage, refetch} =
    result;

  const items = useMemo(
    () => data?.pages.flatMap(page => page.data) ?? [],
    [data],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const footer = isFetchingNextPage ? (
    <View style={styles.footer}>
      <Spinner label={null} />
    </View>
  ) : undefined;

  return {
    items,
    refreshing,
    onRefresh,
    onEndReached,
    footer,
    // Keep showing old data when a refresh fails (e.g. offline)
    stale: result.isError && !!data,
    // An error with no data at all -> show the ListState error
    blockingError: result.isError && !data ? result.error ?? true : null,
  };
}

const styles = StyleSheet.create({
  footer: {paddingVertical: 16},
});
