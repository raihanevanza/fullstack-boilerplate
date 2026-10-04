import { Inbox } from 'lucide-react';
import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { useT } from '@/i18n/useT';

export function Table({ children, flush = false }: { children: ReactNode; flush?: boolean }) {
  return (
    <div
      className={`relative overflow-x-auto ${flush ? '' : 'rounded-2xl border border-line bg-surface shadow-card'}`}
    >
      <table className="min-w-full divide-y divide-line text-sm">{children}</table>
    </div>
  );
}

export function Th({ className = '', ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`bg-surface-2 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-3 ${className}`}
      {...props}
    />
  );
}

export function Td({ className = '', ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`whitespace-nowrap px-4 py-3 text-ink-2 ${className}`} {...props} />;
}

export function TableState({
  colSpan,
  loading,
  error,
  empty,
}: {
  colSpan: number;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
}) {
  const { t } = useT();
  if (!loading && !error && !empty) return null;
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-ink-3">
        {loading ? (
          t('common.loading')
        ) : error ? (
          <span className="text-danger">{error}</span>
        ) : (
          <span className="inline-flex flex-col items-center gap-2">
            <Inbox size={28} strokeWidth={1.5} className="text-ink-3/70" />
            {t('common.empty')}
          </span>
        )}
      </td>
    </tr>
  );
}
