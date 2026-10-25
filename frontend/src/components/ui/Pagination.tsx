import { Pagination as RupaPagination } from '@rupa-ui/react';
import { useT } from '@/i18n/useT';
import { formatNumber } from '@/lib/format';

interface Props {
  page: number;
  limit: number;
  count: number;
  onChange: (page: number) => void;
}

// "Showing 1–10 of 42" plus Rupa's page buttons, with translated labels
export default function Pagination({ page, limit, count, onChange }: Props) {
  const { t } = useT();
  const pages = Math.max(1, Math.ceil(count / limit));
  if (count === 0) return null;

  const from = Math.min((page - 1) * limit + 1, count);
  const to = Math.min(page * limit, count);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-4 text-sm text-ink-3">
      <span>
        {t('pagination.showing')}{' '}
        <span className="font-semibold text-ink-2">
          {formatNumber(from)}–{formatNumber(to)}
        </span>{' '}
        {t('pagination.of')} <span className="font-semibold text-ink-2">{formatNumber(count)}</span>
      </span>
      {pages > 1 && (
        <RupaPagination
          page={page}
          pageCount={pages}
          onPageChange={onChange}
          labels={{
            nav: t('pagination.nav'),
            previous: t('pagination.prev'),
            next: t('pagination.next'),
            page: (p) => t('pagination.page', { page: p }),
            status: (p, n) => t('pagination.status', { page: p, count: n }),
          }}
        />
      )}
    </div>
  );
}
