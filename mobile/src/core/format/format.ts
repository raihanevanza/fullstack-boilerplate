import {localeOf, type Lang} from '@/core/i18n/core';

// Currency symbol shown before every amount. The demo data is priced in Indonesian Rupiah;
// change this (and the backend seed) for another currency.
export const CURRENCY_SYMBOL = 'Rp';

// Cached formatters per language. Digit grouping follows the language
// (id: Rp 1.250.000 · en: Rp 1,250,000). Compact notation is built by hand because Intl in Hermes
// does not support `notation: 'compact'` consistently across devices.
export interface Formatters {
  number: (value: number) => string;
  currency: (value: number) => string;
  currencyCompact: (value: number) => string;
  compact: (value: number) => string;
  dateTime: (value: string | null | undefined) => string;
  // "Sunday, October 4, 2026"
  longDate: (value: Date) => string;
}

const COMPACT_UNITS: Record<Lang, [number, string][]> = {
  id: [
    [1e12, ' T'],
    [1e9, ' M'],
    [1e6, ' jt'],
    [1e3, ' rb'],
  ],
  en: [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ],
};

const cache = new Map<Lang, Formatters>();

function build(lang: Lang): Formatters {
  const locale = localeOf(lang);
  const integer = new Intl.NumberFormat(locale, {maximumFractionDigits: 0});
  const money = new Intl.NumberFormat(locale, {maximumFractionDigits: 2});
  const oneDecimal = new Intl.NumberFormat(locale, {maximumFractionDigits: 1});
  const longDate = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const dateTime = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const compact = (value: number) => {
    const abs = Math.abs(value);
    for (const [size, suffix] of COMPACT_UNITS[lang]) {
      if (abs >= size) {
        return oneDecimal.format(value / size) + suffix;
      }
    }
    return integer.format(value);
  };

  return {
    number: value => integer.format(value),
    currency: value => `${CURRENCY_SYMBOL} ${money.format(value)}`,
    currencyCompact: value => `${CURRENCY_SYMBOL} ${compact(value)}`,
    compact,
    dateTime: value => (value ? dateTime.format(new Date(value)) : '-'),
    longDate: value => longDate.format(value),
  };
}

export function formatters(lang: Lang): Formatters {
  let f = cache.get(lang);
  if (!f) {
    f = build(lang);
    cache.set(lang, f);
  }
  return f;
}
