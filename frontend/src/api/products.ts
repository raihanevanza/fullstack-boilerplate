import { baseApi, cleanParams } from '@/api/baseApi';
import type { Paginated, Product, ProductListParams, ProductRequest } from '@/api/types';

export const productsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    products: build.query<Paginated<Product>, ProductListParams>({
      query: (params) => ({ url: '/products', params: cleanParams(params) }),
      providesTags: (result) => [
        { type: 'Product', id: 'LIST' },
        ...(result?.data ?? []).map((p) => ({ type: 'Product' as const, id: p.id })),
      ],
    }),
    product: build.query<Product, number>({
      query: (id) => ({ url: `/products/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Product', id }],
    }),
    // POST when there is no id, PUT otherwise
    saveProduct: build.mutation<Product, { id?: number; body: ProductRequest }>({
      query: ({ id, body }) =>
        id
          ? { url: `/products/${id}`, method: 'PUT', data: body }
          : { url: '/products', method: 'POST', data: body },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Product', id: 'LIST' },
        ...(id ? [{ type: 'Product' as const, id }] : []),
        'Dashboard',
      ],
    }),
    deleteProduct: build.mutation<null, number>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Product', id: 'LIST' },
        { type: 'Product', id },
        'Dashboard',
      ],
    }),
  }),
});

export const {
  useProductsQuery,
  useProductQuery,
  useSaveProductMutation,
  useDeleteProductMutation,
} = productsApi;
