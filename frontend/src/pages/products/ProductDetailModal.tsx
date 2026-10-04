import { errorMessage } from '@/api/baseApi';
import { useProductQuery } from '@/api/products';
import InfoList from '@/components/InfoList';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/ui/Modal';
import { useT } from '@/i18n/useT';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format';
import { ProductStatus } from './ProductTable';
import { isLowStock } from './utils';

// Read-only view backed by GET /api/products/:id
export default function ProductDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { t } = useT();
  const { data, isLoading, error } = useProductQuery(id);

  return (
    <Modal open size="lg" title={data?.name ?? t('products.detailTitle')} onClose={onClose}>
      {isLoading && <p className="py-6 text-sm text-ink-3">{t('common.loading')}</p>}
      {error && <p className="text-danger py-6 text-sm">{errorMessage(error)}</p>}
      {data && (
        <div className="pb-3">
          <InfoList
            items={[
              [t('products.sku'), data.sku],
              [t('products.name'), data.name],
              [t('common.status'), <ProductStatus key="status" product={data} />],
              [t('products.price'), formatCurrency(data.price)],
              [
                t('products.stock'),
                <span key="stock" className="inline-flex items-center gap-2">
                  {formatNumber(data.stock)}
                  {isLowStock(data) && (
                    <StatusBadge tone="warning">{t('products.low')}</StatusBadge>
                  )}
                </span>,
              ],
              [t('common.created'), formatDateTime(data.created_at)],
              [t('common.updated'), formatDateTime(data.updated_at)],
              [t('products.description'), data.description ?? '-'],
            ]}
          />
        </div>
      )}
    </Modal>
  );
}
