import * as Keychain from 'react-native-keychain';
import {store} from '@/app/store';
import {api} from '@/core/api/api';
import type {LoginResponse, User} from '@/core/api/types';
import {login} from '@/core/auth/session';
import {signedIn} from '@/core/auth/sessionSlice';

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly'},
  getGenericPassword: jest.fn(async () => false),
  setGenericPassword: jest.fn(async () => true),
  resetGenericPassword: jest.fn(async () => true),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const user: User = {
  id: 1,
  full_name: 'Admin User',
  email: 'admin@example.com',
  role: 'ADMIN',
  role_name: 'Administrator',
  last_login_at: null,
  permissions: ['product.write'],
};

function mockFetch(status: number, body: unknown) {
  const fn = jest.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }));
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

// Lets pending listeners and RTK's requestAnimationFrame-based batching settle
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 50));

describe('session', () => {
  beforeEach(() => jest.clearAllMocks());
  // RTK Query syncs subscription state on a 500 ms timer; let it finish before Jest tears down
  afterAll(async () => {
    store.dispatch(api.util.resetApiState());
    await new Promise<void>(resolve => setTimeout(resolve, 700));
  });

  it('stores the token after login and sends the contract headers', async () => {
    const response: LoginResponse = {
      access_token: 'token-1',
      token_type: 'Bearer',
      expires_at: '2999-01-01T00:00:00Z',
      user,
    };
    const fetchMock = mockFetch(200, {
      error: null,
      message: 'success',
      data: response,
    });

    await store.dispatch(login(' admin@example.com ', 'Password123!'));

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe('http://localhost:8080/api/auth/login');
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'admin@example.com',
      password: 'Password123!',
    });
    expect(init.headers).toMatchObject({
      'Accept-Language': 'en',
      'X-Platform': 'mobile',
    });
    expect(store.getState().session.status).toBe('signedIn');
    expect(store.getState().session.user?.permissions).toEqual([
      'product.write',
    ]);
    expect(Keychain.setGenericPassword).toHaveBeenCalled();
  });

  it('signs out when the API answers 401', async () => {
    store.dispatch(
      signedIn({token: 'token-2', expiresAt: '2999-01-01T00:00:00Z', user}),
    );
    const fetchMock = mockFetch(401, {
      error: {
        error_code: 'err_unauthorized',
        title: 'Unauthorized',
        message: 'Your session has expired.',
      },
      message: null,
      data: null,
    });

    const request = store.dispatch(api.endpoints.dashboard.initiate());
    const result = await request;
    request.unsubscribe();
    await flush();

    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(init.headers).toMatchObject({Authorization: 'Bearer token-2'});
    // The sign-out listener resets the API cache, so the failed request leaves no data behind
    expect(result.data).toBeUndefined();
    expect(store.getState().session).toMatchObject({
      status: 'signedOut',
      token: null,
      notice: 'expired',
    });
    expect(Keychain.resetGenericPassword).toHaveBeenCalled();
  });

  it('keeps the session on other errors', async () => {
    store.dispatch(
      signedIn({token: 'token-3', expiresAt: '2999-01-01T00:00:00Z', user}),
    );
    mockFetch(403, {
      error: {
        error_code: 'err_forbidden',
        title: 'Forbidden',
        message: 'No permission.',
      },
      message: null,
      data: null,
    });

    const request = store.dispatch(api.endpoints.deleteProduct.initiate(1));
    await request;
    request.reset();

    expect(store.getState().session.status).toBe('signedIn');
  });
});
