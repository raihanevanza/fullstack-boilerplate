import { Badge, InfoList, StateView } from '@rupa-ui/react';
import { errorMessage } from '@/api/baseApi';
import { useProductQuery } from '@/api/products';
import Dialog from '@/components/ui/Dialog';
import { useT } from '@/i18n/useT';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format';
import { ProductStatus } from './ProductTable';
import { isLowStock } from './utils';

// Read-only view backed by GET /api/products/:id
export default function ProductDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { t } = useT();
  const { data, isLoading, error } = useProductQuery(id);

  return (
    <Dialog size="lg" title={data?.name ?? t('products.detailTitle')} onClose={onClose}>
      {isLoading && (
        <StateView state="loading" compact title={t('common.loading')} description={null} />
      )}
      {error && (
        <StateView
          state="error"
          compact
          title={t('common.failed')}
          description={errorMessage(error)}
        />
      )}
      {data && (
        <InfoList
          columns={3}
          emptyValue="-"
          items={[
            { label: t('products.sku'), value: data.sku },
            { label: t('products.name'), value: data.name },
            { label: t('common.status'), value: <ProductStatus product={data} /> },
            { label: t('products.price'), value: formatCurrency(data.price) },
            {
              label: t('products.stock'),
              value: (
                <span className="inline-flex items-center gap-2">
                  {formatNumber(data.stock)}
                  {isLowStock(data) && (
                    <Badge tone="warning" size="sm">
                      {t('products.low')}
                    </Badge>
                  )}
                </span>
              ),
            },
            { label: t('common.created'), value: formatDateTime(data.created_at) },
            { label: t('common.updated'), value: formatDateTime(data.updated_at) },
            { label: t('products.description'), value: data.description, wide: true },
          ]}
        />
      )}
    </Dialog>
  );
}
