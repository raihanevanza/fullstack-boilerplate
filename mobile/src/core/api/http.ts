import {env} from '@/app/env';
import type {Lang} from '@/core/i18n/core';
import type {Envelope} from './types';

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'unauthenticated'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'validation'
  | 'server'
  | 'unknown';

// Backend error codes the app reacts to (full list in docs/API.md)
export const ERR_USER_INACTIVE = 'err_user_inactive';
export const ERR_DUPLICATE = 'err_duplicate';

// Serializable shape (safe to keep in Redux / RTK Query state)
export interface ApiErrorData {
  kind: ApiErrorKind;
  status: number | null;
  // Backend error_code, e.g. "err_duplicate"
  code: string | null;
  // Backend message, already translated according to Accept-Language
  message: string | null;
}

export class ApiError extends Error {
  readonly data: ApiErrorData;

  constructor(data: ApiErrorData) {
    super(data.message ?? data.kind);
    this.name = 'ApiError';
    this.data = data;
  }
}

export function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) {
    return 'unauthenticated';
  }
  if (status === 403) {
    return 'forbidden';
  }
  if (status === 404) {
    return 'notFound';
  }
  if (status === 409) {
    return 'conflict';
  }
  if (status === 400 || status === 422) {
    return 'validation';
  }
  if (status >= 500) {
    return 'server';
  }
  return 'unknown';
}

export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: QueryParams;
  token?: string | null;
  lang: Lang;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15000;

export function buildQuery(params?: QueryParams): string {
  if (!params) {
    return '';
  }
  const parts = Object.entries(params)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    );
  return parts.length ? `?${parts.join('&')}` : '';
}

// The only door to the backend: standard headers, timeout, envelope unwrapping, error normalization.
export async function request<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const {
    method = 'GET',
    body,
    params,
    token,
    lang,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': lang,
    'X-Platform': 'mobile',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}${buildQuery(params)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError({
      kind: timedOut ? 'timeout' : 'network',
      status: null,
      code: null,
      message: null,
    });
  } finally {
    clearTimeout(timer);
  }

  let envelope: Envelope<T> | null = null;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    envelope = null;
  }

  if (!response.ok || !envelope || envelope.error) {
    throw new ApiError({
      kind: response.ok ? 'unknown' : kindFromStatus(response.status),
      status: response.status,
      code: envelope?.error?.error_code ?? null,
      message: envelope?.error?.message ?? null,
    });
  }

  return envelope.data;
}
