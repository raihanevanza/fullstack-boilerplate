import type {BaseQueryFn} from '@reduxjs/toolkit/query';
import type {RootState} from '@/app/store';
import {signedOut} from '@/core/auth/sessionSlice';
import {
  ApiError,
  ERR_USER_INACTIVE,
  request,
  type ApiErrorData,
  type QueryParams,
  type RequestOptions,
} from './http';

export interface ApiArgs {
  url: string;
  method?: RequestOptions['method'];
  body?: unknown;
  params?: QueryParams;
}

export const baseQuery: BaseQueryFn<
  ApiArgs | string,
  unknown,
  ApiErrorData
> = async (args, api) => {
  const {url, ...rest} = typeof args === 'string' ? {url: args} : args;
  const {session, prefs} = api.getState() as RootState;

  try {
    const data = await request(url, {
      ...rest,
      token: session.token,
      lang: prefs.lang,
    });
    return {data};
  } catch (err) {
    const error: ApiErrorData =
      err instanceof ApiError
        ? err.data
        : {kind: 'unknown', status: null, code: null, message: null};

    // Token expired or revoked mid-session, or the account was disabled -> back to the login screen
    // (the store listener clears the Keychain entry and the API cache)
    if (session.status === 'signedIn') {
      if (error.kind === 'unauthenticated') {
        api.dispatch(signedOut('expired'));
      } else if (error.code === ERR_USER_INACTIVE) {
        api.dispatch(signedOut('inactive'));
      }
    }
    return {error};
  }
};
