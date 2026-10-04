import {createApi} from '@reduxjs/toolkit/query/react';
import {baseQuery} from './baseQuery';
import type {
  Dashboard,
  Paginated,
  Product,
  ProductListArgs,
  ProductRequest,
} from './types';

export const PAGE_SIZE = 20;

// Next page number for infinite queries, or undefined when every row has been loaded
export function nextPageParam(
  lastPage: Paginated<unknown>,
  _allPages: unknown,
  lastPageParam: number,
): number | undefined {
  const {page, limit, count} = lastPage.pagination;
  return page * limit < count ? lastPageParam + 1 : undefined;
}

const LIST = {type: 'Product' as const, id: 'LIST'};

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Dashboard', 'Product'],
  // Refetch when a screen is opened again after 60 seconds
  refetchOnMountOrArgChange: 60,
  endpoints: build => ({
    dashboard: build.query<Dashboard, void>({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),

    products: build.infiniteQuery<Paginated<Product>, ProductListArgs, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: nextPageParam,
      },
      query: ({queryArg, pageParam}) => ({
        url: '/products',
        params: {
          search: queryArg.search,
          active_only: queryArg.activeOnly ? true : undefined,
          page: pageParam,
          limit: PAGE_SIZE,
        },
      }),
      providesTags: [LIST],
    }),
    product: build.query<Product, number>({
      query: id => `/products/${id}`,
      providesTags: (_result, _error, id) => [{type: 'Product', id}],
    }),
    // Writes invalidate even when they fail: after a timeout the server may have applied the change
    createProduct: build.mutation<Product, ProductRequest>({
      query: body => ({url: '/products', method: 'POST', body}),
      invalidatesTags: [LIST, 'Dashboard'],
    }),
    updateProduct: build.mutation<Product, {id: number; body: ProductRequest}>({
      query: ({id, body}) => ({url: `/products/${id}`, method: 'PUT', body}),
      invalidatesTags: (_result, _error, {id}) => [
        {type: 'Product', id},
        LIST,
        'Dashboard',
      ],
    }),
    // The detail entry is not invalidated on delete: refetching it would only return 404 while the screen closes
    deleteProduct: build.mutation<null, number>({
      query: id => ({url: `/products/${id}`, method: 'DELETE'}),
      invalidatesTags: [LIST, 'Dashboard'],
    }),
  }),
});

export const {
  useDashboardQuery,
  useProductsInfiniteQuery,
  useProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = api;
