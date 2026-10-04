import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { errorMessage } from '@/api/baseApi';
import { useDeleteProductMutation, useProductsQuery } from '@/api/products';
import type { Product } from '@/api/types';
import ConfirmDialog from '@/components/ConfirmDialog';
import ListToolbar from '@/components/ListToolbar';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { usePermission } from '@/features/auth/usePermission';
import { useT } from '@/i18n/useT';
import { useNotify } from '@/lib/notify';
import { useListParams } from '@/lib/useListParams';
import ProductDetailModal from './ProductDetailModal';
import ProductFormModal from './ProductFormModal';
import ProductTable from './ProductTable';

const iconButton =
  'grid h-8 w-8 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink';

export default function ProductListPage() {
  const { t } = useT();
  const canWrite = usePermission('product.write');
  const notify = useNotify();
  const { params, search, filters, set } = useListParams(['active_only']);
  const { data, isFetching, error } = useProductsQuery(params);
  const [remove, { isLoading: removing }] = useDeleteProductMutation();

  // undefined = closed, null = create, Product = edit
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [viewing, setViewing] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await notify(remove(deleting.id), t('products.deleted'));
    if (res.ok) {
      setDeleting(null);
      // Deleting the last row of a page: step back so the page is not empty
      if (data && data.data.length === 1 && params.page && params.page > 1) {
        set('page', params.page - 1);
      }
    }
  };

  return (
    <>
      <PageHeader
        title={t('products.title')}
        subtitle={canWrite ? t('products.subtitle') : t('products.readOnly')}
        actions={
          canWrite && (
            <Button onClick={() => setEditing(null)}>
              <Plus size={16} /> {t('products.add')}
            </Button>
          )
        }
      />

      <ListToolbar
        search={search}
        onSearch={(v) => set('search', v)}
        placeholder={t('products.search')}
      >
        <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-sm text-ink-2 shadow-sm hover:bg-surface-2">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[rgb(var(--primary))]"
            checked={filters.active_only === 'true'}
            onChange={(e) => set('active_only', e.target.checked)}
          />
          {t('products.activeOnly')}
        </label>
      </ListToolbar>

      <div className={isFetching && data ? 'opacity-70 transition-opacity' : undefined}>
        <ProductTable
          rows={data?.data}
          loading={isFetching}
          error={error ? errorMessage(error) : null}
          actions={(p) => (
            <span className="inline-flex items-center gap-1">
              <button
                type="button"
                className={iconButton}
                onClick={() => setViewing(p.id)}
                aria-label={`${t('common.view')} ${p.sku}`}
                title={t('common.view')}
              >
                <Eye size={16} />
              </button>
              {canWrite && (
                <>
                  <button
                    type="button"
                    className={iconButton}
                    onClick={() => setEditing(p)}
                    aria-label={`${t('common.edit')} ${p.sku}`}
                    title={t('common.edit')}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className={`${iconButton} hover:text-danger hover:bg-rose-50 dark:hover:bg-rose-400/10`}
                    onClick={() => setDeleting(p)}
                    aria-label={`${t('common.delete')} ${p.sku}`}
                    title={t('common.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </span>
          )}
        />
      </div>

      {data && (
        <Pagination
          page={data.pagination.page}
          limit={data.pagination.limit}
          count={data.pagination.count}
          onChange={(p) => set('page', p)}
        />
      )}

      {editing !== undefined && (
        <ProductFormModal product={editing} onClose={() => setEditing(undefined)} />
      )}
      {viewing !== null && <ProductDetailModal id={viewing} onClose={() => setViewing(null)} />}
      {deleting && (
        <ConfirmDialog
          open
          danger
          title={t('products.deleteTitle')}
          description={t('products.deleteConfirm', { name: deleting.name, sku: deleting.sku })}
          confirmLabel={t('common.delete')}
          loading={removing}
          onClose={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
