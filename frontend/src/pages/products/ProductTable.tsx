import { Badge, StateView, Table, type TableColumn } from '@rupa-ui/react';
import type { ReactNode } from 'react';
import type { Product } from '@/api/types';
import { useT } from '@/i18n/useT';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { isLowStock } from './utils';

export function ProductStatus({ product }: { product: Product }) {
  const { t } = useT();
  return product.is_active ? (
    <Badge tone="success" dot>
      {t('common.active')}
    </Badge>
  ) : (
    <Badge tone="neutral" dot>
      {t('common.inactive')}
    </Badge>
  );
}

// Product rows, shared by the product list and the dashboard ("compact" drops secondary columns)
export default function ProductTable({
  rows,
  caption,
  loading,
  error,
  flush,
  compact,
  actions,
}: {
  rows: Product[] | undefined;
  // Names the table for screen readers (not shown)
  caption: string;
  loading?: boolean;
  error?: string | null;
  // true = no frame (inside a Card)
  flush?: boolean;
  compact?: boolean;
  // Row action buttons (rendered in the last column)
  actions?: (product: Product) => ReactNode;
}) {
  const { t } = useT();

  const columns: TableColumn<Product>[] = [
    {
      key: 'name',
      header: t('products.name'),
      render: (p) => (
        <div className="min-w-[12rem] max-w-[22rem]">
          <div className="font-semibold text-ink">{p.name}</div>
          <div className="text-xs text-ink-3">
            {p.sku}
            {!compact && p.description && <> · {p.description}</>}
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: t('products.price'),
      align: 'end',
      render: (p) => <span className="whitespace-nowrap">{formatCurrency(p.price)}</span>,
    },
    {
      key: 'stock',
      header: t('products.stock'),
      align: 'end',
      render: (p) => (
        <span className="inline-flex items-center justify-end gap-2">
          {isLowStock(p) && (
            <Badge tone="warning" size="sm">
              {t('products.low')}
            </Badge>
          )}
          <span className="font-medium text-ink">{formatNumber(p.stock)}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (p) => <ProductStatus product={p} />,
    },
  ];
  if (!compact) {
    columns.push({
      key: 'created',
      header: t('common.created'),
      hideOnMobile: true,
      render: (p) => <span className="whitespace-nowrap">{formatDate(p.created_at)}</span>,
    });
  }
  if (actions) {
    columns.push({
      key: 'actions',
      header: <span className="sr-only">{t('common.actions')}</span>,
      align: 'end',
      render: actions,
    });
  }

  return (
    <Table
      caption={caption}
      hideCaption
      columns={columns}
      rows={rows ?? []}
      rowKey={(p) => p.id}
      // Refetches keep the current rows on screen; skeletons only before the first load
      loading={loading && !rows}
      loadingLabel={t('common.loading')}
      error={
        error ? (
          <StateView state="error" compact title={t('common.failed')} description={error} />
        ) : undefined
      }
      empty={<StateView state="empty" compact title={t('common.empty')} description={null} />}
      className={flush ? 'rounded-none border-0 bg-transparent' : 'shadow-card'}
    />
  );
}
