import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { AxiosError, Method } from 'axios';
import { api } from '@/api/client';
import { translate } from '@/i18n/core';
import type { ApiEnvelope, ApiError, ListParams } from '@/api/types';

interface RequestArgs {
  url: string;
  method?: Method;
  data?: unknown;
  params?: ListParams;
}

// Responses are wrapped in { error, message, data }: return `data`, normalize errors
const axiosBaseQuery: BaseQueryFn<RequestArgs, unknown, ApiError> = async ({
  url,
  method = 'GET',
  data,
  params,
}) => {
  try {
    const res = await api.request<ApiEnvelope<unknown>>({ url, method, data, params });
    return { data: res.data.data };
  } catch (err) {
    const error = err as AxiosError<ApiEnvelope<unknown>>;
    const body = error.response?.data?.error;
    return {
      error: {
        status: error.response?.status ?? 0,
        code: body?.error_code ?? 'network_error',
        title: body?.title ?? translate('common.failed'),
        message: body?.message ?? translate('common.networkError'),
      },
    };
  }
};

// Drop empty filters so the URL stays clean (?search=&active_only=false → nothing)
export const cleanParams = (params?: ListParams): ListParams | undefined => {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== false),
  );
};

// One API slice for the whole app. Feature files add endpoints with `baseApi.injectEndpoints`
// (see auth.ts, dashboard.ts, products.ts).
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Me', 'Dashboard', 'Product'],
  endpoints: () => ({}),
});

export function isApiError(error: unknown): error is ApiError {
  return !!error && typeof error === 'object' && 'code' in error && 'message' in error;
}

// Message to show in a toast or alert (already translated by the backend via Accept-Language)
export function errorMessage(error: unknown, fallback: string = translate('common.error')) {
  return isApiError(error) ? error.message : fallback;
}
