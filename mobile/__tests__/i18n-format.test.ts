import {formatters} from '@/core/format/format';
import {DEFAULT_LANG, translate} from '@/core/i18n/core';
import {en} from '@/core/i18n/en';
import {id} from '@/core/i18n/id';

describe('i18n', () => {
  it('defaults to English', () => {
    expect(DEFAULT_LANG).toBe('en');
  });

  it('en and id define the same keys', () => {
    expect(Object.keys(id).sort()).toEqual(Object.keys(en).sort());
  });

  it('fills in parameters', () => {
    expect(translate('en', 'home.welcome', {name: 'Ada'})).toBe(
      'Welcome back, Ada',
    );
    expect(translate('id', 'validation.maxLength', {max: 50})).toBe(
      'Maksimal 50 karakter',
    );
  });
});

describe('format', () => {
  it('groups digits per language', () => {
    expect(formatters('id').currency(1250000)).toBe('Rp 1.250.000');
    expect(formatters('en').currency(1250000)).toBe('Rp 1,250,000');
    expect(formatters('en').currency(99000.5)).toBe('Rp 99,000.5');
  });

  it('compact notation', () => {
    expect(formatters('id').currencyCompact(15_250_000)).toBe('Rp 15,3 jt');
    expect(formatters('en').currencyCompact(15_250_000)).toBe('Rp 15.3M');
    expect(formatters('en').compact(950)).toBe('950');
  });

  it('formats missing timestamps as a dash', () => {
    expect(formatters('en').dateTime(null)).toBe('-');
    expect(formatters('en').dateTime('2026-10-04T03:00:00Z')).toContain('2026');
  });
});
