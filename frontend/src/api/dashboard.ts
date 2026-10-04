import { baseApi } from '@/api/baseApi';
import type { Dashboard } from '@/api/types';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    dashboard: build.query<Dashboard, void>({
      query: () => ({ url: '/dashboard' }),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useDashboardQuery } = dashboardApi;
