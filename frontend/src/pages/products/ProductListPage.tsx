import { Button, Checkbox, IconButton, PageHeader, useToast } from '@rupa-ui/react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { errorMessage } from '@/api/baseApi';
import { useDeleteProductMutation, useProductsQuery } from '@/api/products';
import type { Product } from '@/api/types';
import ListToolbar from '@/components/ListToolbar';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import { usePermission } from '@/features/auth/usePermission';
import { useT } from '@/i18n/useT';
import { useListParams } from '@/lib/useListParams';
import ProductDetailModal from './ProductDetailModal';
import ProductFormModal from './ProductFormModal';
import ProductTable from './ProductTable';

export default function ProductListPage() {
  const { t } = useT();
  const canWrite = usePermission('product.write');
  const toast = useToast();
  const { params, search, filters, set } = useListParams(['active_only']);
  const { data, isFetching, error } = useProductsQuery(params);
  const [remove] = useDeleteProductMutation();

  // undefined = closed, null = create, Product = edit
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [viewing, setViewing] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  // Throwing keeps the dialog open with the error; resolving closes it
  const confirmDelete = async (product: Product) => {
    const res = await remove(product.id);
    if ('error' in res) throw new Error(errorMessage(res.error));
    toast.show({ tone: 'success', title: t('products.deleted') });
    // Deleting the last row of a page: step back so the page is not empty
    if (data && data.data.length === 1 && params.page && params.page > 1) {
      set('page', params.page - 1);
    }
  };

  return (
    <>
      <PageHeader
        title={t('products.title')}
        description={canWrite ? t('products.subtitle') : t('products.readOnly')}
        className="mb-6"
        actions={
          canWrite && (
            <Button
              variant="primary"
              iconStart={<Plus size={16} />}
              onClick={() => setEditing(null)}
            >
              {t('products.add')}
            </Button>
          )
        }
      />

      <ListToolbar
        search={search}
        onSearch={(v) => set('search', v)}
        placeholder={t('products.search')}
      >
        <Checkbox
          label={t('products.activeOnly')}
          checked={filters.active_only === 'true'}
          onChange={(e) => set('active_only', e.target.checked)}
        />
      </ListToolbar>

      <div className={isFetching && data ? 'opacity-70 transition-opacity' : undefined}>
        <ProductTable
          rows={data?.data}
          caption={t('products.title')}
          loading={isFetching}
          error={error ? errorMessage(error) : null}
          actions={(p) => (
            <span className="inline-flex items-center gap-1">
              <IconButton
                size="sm"
                icon={<Eye size={16} />}
                label={`${t('common.view')} ${p.sku}`}
                onClick={() => setViewing(p.id)}
              />
              {canWrite && (
                <>
                  <IconButton
                    size="sm"
                    icon={<Pencil size={16} />}
                    label={`${t('common.edit')} ${p.sku}`}
                    onClick={() => setEditing(p)}
                  />
                  <IconButton
                    size="sm"
                    icon={<Trash2 size={16} />}
                    label={`${t('common.delete')} ${p.sku}`}
                    onClick={() => setDeleting(p)}
                  />
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
          danger
          title={t('products.deleteTitle')}
          description={t('products.deleteConfirm', { name: deleting.name, sku: deleting.sku })}
          confirmLabel={t('common.delete')}
          onClose={() => setDeleting(null)}
          onConfirm={() => confirmDelete(deleting)}
        />
      )}
    </>
  );
}
