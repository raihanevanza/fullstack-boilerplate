import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setLanguage } from '@/features/ui/uiSlice';
import { setCurrentLang, translate, type Lang, type TKey, type Vars } from './core';

// Components that render text, numbers or dates use this hook so they re-render on language change
export function useT() {
  const lang = useAppSelector((state) => state.ui.language);
  const dispatch = useAppDispatch();

  const t = useCallback((key: TKey, vars?: Vars) => translate(key, vars, lang), [lang]);
  const setLang = useCallback(
    (next: Lang) => {
      setCurrentLang(next);
      dispatch(setLanguage(next));
    },
    [dispatch],
  );

  return { t, lang, setLang };
}

export type TFunction = ReturnType<typeof useT>['t'];
