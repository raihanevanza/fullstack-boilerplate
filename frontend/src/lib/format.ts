import { getLang, localeOf, type Lang } from '@/i18n/core';
import { CURRENCY } from '@/lib/config';

// Formatters are created per language and cached. The currency comes from VITE_CURRENCY;
// separators follow the UI language (en: Rp 1,250,000 · id: Rp 1.250.000).
interface Formatters {
  currency: Intl.NumberFormat;
  compactCurrency: Intl.NumberFormat;
  number: Intl.NumberFormat;
  date: Intl.DateTimeFormat;
  dateTime: Intl.DateTimeFormat;
}

const cache = new Map<Lang, Formatters>();

function fmt(lang: Lang = getLang()): Formatters {
  let f = cache.get(lang);
  if (!f) {
    const locale = localeOf(lang);
    const money = {
      style: 'currency',
      currency: CURRENCY,
      currencyDisplay: 'narrowSymbol',
    } as const;
    f = {
      currency: new Intl.NumberFormat(locale, {
        ...money,
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      }),
      compactCurrency: new Intl.NumberFormat(locale, {
        ...money,
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
      number: new Intl.NumberFormat(locale),
      date: new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }),
      dateTime: new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    cache.set(lang, f);
  }
  return f;
}

export const formatCurrency = (value: number) => fmt().currency.format(value);
// "Rp 15.3M" / "Rp 15,3 jt" for tight spaces (donut center, small tiles)
export const formatCurrencyCompact = (value: number) => fmt().compactCurrency.format(value);
export const formatNumber = (value: number) => fmt().number.format(value);

// UTC timestamps from the backend → the browser's local time
export const formatDate = (value: string | null | undefined) =>
  value ? fmt().date.format(new Date(value)) : '-';
export const formatDateTime = (value: string | null | undefined) =>
  value ? fmt().dateTime.format(new Date(value)) : '-';

// Separators and currency symbol for the current language (used by CurrencyInput)
export function numberParts(lang: Lang = getLang()) {
  const parts = fmt(lang).currency.formatToParts(1234567.5);
  return {
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
    symbol: parts.find((p) => p.type === 'currency')?.value ?? CURRENCY,
  };
}
