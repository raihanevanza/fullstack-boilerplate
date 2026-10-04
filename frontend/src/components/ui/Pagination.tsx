import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useT } from '@/i18n/useT';
import { formatNumber } from '@/lib/format';

interface Props {
  page: number;
  limit: number;
  count: number;
  onChange: (page: number) => void;
}

const navButton =
  'grid h-8 w-8 place-items-center rounded-lg border border-line bg-surface text-ink-2 hover:bg-surface-3 disabled:opacity-40 disabled:hover:bg-surface';

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
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={t('pagination.prev')}
          className={navButton}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[4rem] text-center font-medium text-ink-2">
          {page} / {pages}
        </span>
        <button
          type="button"
          aria-label={t('pagination.next')}
          className={navButton}
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
