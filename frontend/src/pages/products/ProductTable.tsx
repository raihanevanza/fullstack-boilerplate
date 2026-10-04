import type { ReactNode } from 'react';
import type { Product } from '@/api/types';
import StatusBadge from '@/components/StatusBadge';
import { Table, TableState, Td, Th } from '@/components/ui/Table';
import { useT } from '@/i18n/useT';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { isLowStock } from './utils';

export function ProductStatus({ product }: { product: Product }) {
  const { t } = useT();
  return product.is_active ? (
    <StatusBadge tone="success">{t('common.active')}</StatusBadge>
  ) : (
    <StatusBadge tone="neutral">{t('common.inactive')}</StatusBadge>
  );
}

// Product rows, shared by the product list and the dashboard ("compact" drops secondary columns)
export default function ProductTable({
  rows,
  loading,
  error,
  flush,
  compact,
  actions,
}: {
  rows: Product[] | undefined;
  loading?: boolean;
  error?: string | null;
  // true = no frame (inside a Card)
  flush?: boolean;
  compact?: boolean;
  // Row action buttons (rendered in the last column)
  actions?: (product: Product) => ReactNode;
}) {
  const { t } = useT();
  const colSpan = 4 + (compact ? 0 : 1) + (actions ? 1 : 0);

  return (
    <Table flush={flush}>
      <thead>
        <tr>
          <Th>{t('products.name')}</Th>
          <Th className="text-right">{t('products.price')}</Th>
          <Th className="text-right">{t('products.stock')}</Th>
          <Th>{t('common.status')}</Th>
          {!compact && <Th>{t('common.created')}</Th>}
          {actions && (
            <Th className="text-right">
              <span className="sr-only">{t('common.actions')}</span>
            </Th>
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        <TableState
          colSpan={colSpan}
          loading={loading && !rows}
          error={error}
          empty={!loading && !error && rows?.length === 0}
        />
        {rows?.map((p) => (
          <tr key={p.id} className="hover:bg-surface-2">
            <Td className="max-w-[22rem] whitespace-normal">
              <div className="font-semibold text-ink">{p.name}</div>
              <div className="text-xs text-ink-3">
                {p.sku}
                {!compact && p.description && <> · {p.description}</>}
              </div>
            </Td>
            <Td className="text-right">{formatCurrency(p.price)}</Td>
            <Td className="text-right">
              <span className="inline-flex items-center justify-end gap-2">
                {isLowStock(p) && <StatusBadge tone="warning">{t('products.low')}</StatusBadge>}
                <span className="font-medium text-ink">{formatNumber(p.stock)}</span>
              </span>
            </Td>
            <Td>
              <ProductStatus product={p} />
            </Td>
            {!compact && <Td>{formatDate(p.created_at)}</Td>}
            {actions && <Td className="text-right">{actions(p)}</Td>}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
