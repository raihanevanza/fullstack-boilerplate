import type {TKey} from '@/core/i18n/core';
import type {ApiErrorData} from './http';

export const isApiErrorData = (value: unknown): value is ApiErrorData =>
  typeof value === 'object' && value !== null && 'kind' in value;

// The backend message (already translated via Accept-Language) wins; otherwise a generic message
export function errorMessage(error: unknown, t: (key: TKey) => string): string {
  if (isApiErrorData(error)) {
    if (error.message) {
      return error.message;
    }
    if (error.kind === 'network') {
      return t('common.networkError');
    }
    if (error.kind === 'timeout') {
      return t('common.timeout');
    }
  }
  return t('common.error');
}

export const errorKind = (error: unknown) =>
  isApiErrorData(error) ? error.kind : 'unknown';

export const errorCode = (error: unknown) =>
  isApiErrorData(error) ? error.code : null;
