import {en} from './en';
import {id} from './id';

export type Lang = 'en' | 'id';
export type TKey = keyof typeof en;
export type TParams = Record<string, string | number>;

const dictionaries: Record<Lang, Record<TKey, string>> = {en, id};

export const LANGS: Lang[] = ['en', 'id'];
export const DEFAULT_LANG: Lang = 'en';

// Options for the language switch; each label is written in its own language
export const LANG_OPTIONS: {
  value: Lang;
  label: string;
  accessibilityLabel: string;
}[] = [
  {value: 'en', label: 'EN', accessibilityLabel: 'English'},
  {value: 'id', label: 'ID', accessibilityLabel: 'Bahasa Indonesia'},
];

export const localeOf = (lang: Lang) => (lang === 'id' ? 'id-ID' : 'en-US');

export function translate(lang: Lang, key: TKey, params?: TParams): string {
  const text = dictionaries[lang][key] ?? key;
  if (!params) {
    return text;
  }
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
