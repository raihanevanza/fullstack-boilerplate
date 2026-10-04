import { forwardRef, useLayoutEffect, useRef, useState, type InputHTMLAttributes } from 'react';
import { useT } from '@/i18n/useT';
import { numberParts } from '@/lib/format';
import { Input } from './Field';

interface CurrencyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'defaultValue'
> {
  // NaN = empty
  value: number;
  onChange: (value: number) => void;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Money input with live thousand separators for the active language
// (en: 1,250,000.50 · id: 1.250.000,50). Up to 2 decimals; the caret stays in place while typing.
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput({ value, onChange, onBlur, className = '', ...props }, ref) {
    const { lang } = useT();
    const { group, decimal, symbol } = numberParts(lang);
    const formatValue = (v: number) =>
      Number.isFinite(v)
        ? new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', {
            maximumFractionDigits: 2,
          }).format(v)
        : '';

    // Keep incomplete decimals (e.g. "1,000." or "1,000.0") while editing
    const [draft, setDraft] = useState({ value, lang, text: formatValue(value) });
    const inputRef = useRef<HTMLInputElement | null>(null);
    const caret = useRef<number | null>(null);
    const text =
      Object.is(value, draft.value) && draft.lang === lang ? draft.text : formatValue(value);

    useLayoutEffect(() => {
      if (caret.current !== null) {
        inputRef.current?.setSelectionRange(caret.current, caret.current);
        caret.current = null;
      }
    });

    const groupRe = new RegExp(`[${escape(group)}\\s]`, 'g');
    const validRe = new RegExp(`^\\d*(${escape(decimal)}\\d{0,2})?$`);

    return (
      <span className="relative block">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-3"
        >
          {symbol}
        </span>
        <Input
          {...props}
          ref={(element) => {
            inputRef.current = element;
            if (typeof ref === 'function') ref(element);
            else if (ref) ref.current = element;
          }}
          type="text"
          inputMode="decimal"
          className={`pl-11 text-right ${className}`}
          value={text}
          onChange={(event) => {
            const raw = event.target.value;
            // Also accepts pasted amounts such as "Rp 1,234.50"
            const cleaned = raw.split(symbol).join('').replace(groupRe, '');
            if (!validRe.test(cleaned)) return;
            const [integer, fraction] = cleaned.split(decimal);
            const digits = integer.replace(/^0+(?=\d)/, '') || (fraction !== undefined ? '0' : '');
            const formatted =
              digits.replace(/\B(?=(\d{3})+(?!\d))/g, group) +
              (fraction !== undefined ? `${decimal}${fraction}` : '');
            const nextValue = cleaned === '' ? NaN : Number(`${digits}.${fraction ?? ''}`);
            if (cleaned !== '' && !Number.isFinite(nextValue)) return;
            // Put the caret after the same number of digits it was after before formatting
            const logicalPosition = raw
              .slice(0, event.target.selectionStart ?? raw.length)
              .split('')
              .filter((ch) => /\d/.test(ch) || ch === decimal).length;
            let position = 0;
            let count = 0;
            while (position < formatted.length && count < logicalPosition) {
              if (formatted[position] !== group) count++;
              position++;
            }
            caret.current = position;
            setDraft({ value: nextValue, lang, text: formatted });
            onChange(nextValue);
          }}
          onKeyDown={(event) => {
            props.onKeyDown?.(event);
            if (event.defaultPrevented) return;
            const input = event.currentTarget;
            const start = input.selectionStart ?? 0;
            if (start !== input.selectionEnd) return;
            // Skip grouping separators so Backspace/Delete still remove a digit
            if (event.key === 'Backspace' && text[start - 1] === group)
              input.setSelectionRange(start - 1, start - 1);
            if (event.key === 'Delete' && text[start] === group)
              input.setSelectionRange(start + 1, start + 1);
          }}
          onBlur={(event) => {
            setDraft({ value, lang, text: formatValue(value) });
            onBlur?.(event);
          }}
        />
      </span>
    );
  },
);
