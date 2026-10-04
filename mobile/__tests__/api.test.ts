import {nextPageParam} from '@/core/api/api';
import {errorCode, errorKind, errorMessage} from '@/core/api/errorMessage';
import {buildQuery, kindFromStatus} from '@/core/api/http';
import type {User} from '@/core/api/types';
import {hasPermission, isExpired} from '@/core/auth/sessionSlice';

describe('kindFromStatus', () => {
  it.each([
    [401, 'unauthenticated'],
    [403, 'forbidden'],
    [404, 'notFound'],
    [409, 'conflict'],
    [400, 'validation'],
    [422, 'validation'],
    [500, 'server'],
    [503, 'server'],
    [418, 'unknown'],
  ])('%i -> %s', (status, kind) => {
    expect(kindFromStatus(status)).toBe(kind);
  });
});

describe('buildQuery', () => {
  it('drops empty values and encodes the rest', () => {
    expect(
      buildQuery({
        search: 'mouse & pad',
        page: 1,
        active_only: true,
        x: undefined,
        y: '',
        z: null,
      }),
    ).toBe('?search=mouse%20%26%20pad&page=1&active_only=true');
    expect(buildQuery()).toBe('');
    expect(buildQuery({a: undefined})).toBe('');
  });
});

describe('nextPageParam', () => {
  const page = (p: number, limit: number, count: number) => ({
    data: [],
    pagination: {page: p, limit, count},
  });

  it('asks for the next page while rows remain', () => {
    expect(nextPageParam(page(1, 20, 42), [], 1)).toBe(2);
    expect(nextPageParam(page(2, 20, 42), [], 2)).toBe(3);
  });

  it('stops when count is reached', () => {
    expect(nextPageParam(page(3, 20, 42), [], 3)).toBeUndefined();
    expect(nextPageParam(page(1, 20, 20), [], 1)).toBeUndefined();
    expect(nextPageParam(page(1, 20, 0), [], 1)).toBeUndefined();
  });
});

describe('errorMessage', () => {
  const t = (key: string) => `t:${key}`;

  it('prefers the backend message', () => {
    const error = {
      kind: 'conflict',
      status: 409,
      code: 'err_duplicate',
      message: 'SKU already exists',
    };
    expect(errorMessage(error, t)).toBe('SKU already exists');
    expect(errorKind(error)).toBe('conflict');
    expect(errorCode(error)).toBe('err_duplicate');
  });

  it('falls back to generic messages', () => {
    expect(
      errorMessage(
        {kind: 'network', status: null, code: null, message: null},
        t,
      ),
    ).toBe('t:common.networkError');
    expect(
      errorMessage(
        {kind: 'timeout', status: null, code: null, message: null},
        t,
      ),
    ).toBe('t:common.timeout');
    expect(errorMessage(new Error('boom'), t)).toBe('t:common.error');
    expect(errorKind(undefined)).toBe('unknown');
    expect(errorCode('nope')).toBeNull();
  });
});

describe('session helpers', () => {
  const user = (permissions: string[]) => ({permissions} as User);

  it('reads permissions from the user, never the role', () => {
    expect(hasPermission(user(['product.write']), 'product.write')).toBe(true);
    expect(hasPermission(user([]), 'product.write')).toBe(false);
    expect(hasPermission(null, 'product.write')).toBe(false);
  });

  it('treats the token as expired exactly at expires_at', () => {
    const now = Date.parse('2026-10-04T10:00:00Z');
    expect(isExpired('2026-10-04T10:00:00Z', now)).toBe(true);
    expect(isExpired('2026-10-04T10:00:01Z', now)).toBe(false);
  });
});
