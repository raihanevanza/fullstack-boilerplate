import {useCallback} from 'react';
import {useAppSelector} from '@/app/hooks';
import {translate, type TKey, type TParams} from './core';

export function useT() {
  const lang = useAppSelector(state => state.prefs.lang);
  const t = useCallback(
    (key: TKey, params?: TParams) => translate(lang, key, params),
    [lang],
  );
  return {t, lang};
}
