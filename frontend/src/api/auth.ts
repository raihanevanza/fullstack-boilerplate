import { baseApi } from '@/api/baseApi';
import type { LoginRequest, LoginResponse, User } from '@/api/types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', data: body }),
    }),
    me: build.query<User, void>({
      query: () => ({ url: '/auth/me' }),
      providesTags: ['Me'],
    }),
  }),
});

export const { useLoginMutation, useMeQuery } = authApi;
