import { en } from './en';
import { id, type TKey } from './id';

export type Lang = 'en' | 'id';
export type { TKey };
export type Vars = Record<string, string | number>;

export const DEFAULT_LANG: Lang = 'en';

const dictionaries: Record<Lang, Record<TKey, string>> = { en, id };
const STORAGE_KEY = 'lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'id' || saved === 'en') return saved;
  } catch {
    // Storage blocked: use the default
  }
  return DEFAULT_LANG;
}

// The active language also lives at module level so it can be used outside React
// (formatters, the Accept-Language header, fallback API messages)
let current: Lang = initialLang();
document.documentElement.lang = current;

export const getLang = () => current;
export const localeOf = (lang: Lang = current) => (lang === 'id' ? 'id-ID' : 'en-US');

export function setCurrentLang(lang: Lang) {
  current = lang;
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Still applies for this session
  }
}

export function translate(key: TKey, vars?: Vars, lang: Lang = current): string {
  const template = dictionaries[lang][key] ?? dictionaries[DEFAULT_LANG][key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}
