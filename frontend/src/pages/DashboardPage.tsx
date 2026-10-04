import {
  Archive,
  CircleCheck,
  Package,
  PackageSearch,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { errorMessage } from '@/api/baseApi';
import { useDashboardQuery } from '@/api/dashboard';
import type { Dashboard } from '@/api/types';
import DonutChart from '@/components/charts/DonutChart';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import ProductTable from '@/pages/products/ProductTable';
import { useCurrentUser } from '@/features/auth/usePermission';
import { useT } from '@/i18n/useT';
import { formatCurrency, formatCurrencyCompact, formatNumber } from '@/lib/format';
import { LOW_STOCK_THRESHOLD } from '@/lib/config';

// Validated chart series slots (src/index.css). Each slot follows its entity, never its rank.
const SERIES = {
  inStock: 'var(--series-1)',
  inactive: 'var(--series-2)',
  lowStock: 'var(--series-3)',
};

function StatTile({
  label,
  value,
  caption,
  icon: Icon,
  tone,
  to,
}: {
  label: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  tone: string;
  to?: string;
}) {
  const body = (
    <div className="h-full rounded-2xl border border-line bg-surface p-5 shadow-card transition-colors hover:border-accent-line">
      <div className="flex items-center gap-3">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ring-inset ${tone}`}>
          <Icon size={18} />
        </span>
        <p className="text-sm font-medium text-ink-2">{label}</p>
      </div>
      <p className="mt-4 truncate text-[28px] font-bold leading-none tracking-tight text-ink">
        {value}
      </p>
      <p className="mt-2 text-xs text-ink-3">{caption}</p>
    </div>
  );
  return to ? (
    <Link
      to={to}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      {body}
    </Link>
  ) : (
    body
  );
}

function StatusCard({ data }: { data: Dashboard }) {
  const { t } = useT();
  // Disjoint groups that add up to the total
  const slices = [
    {
      label: t('dashboard.inStock'),
      value: Math.max(0, data.active_products - data.low_stock_products),
      color: SERIES.inStock,
    },
    { label: t('dashboard.lowStockSlice'), value: data.low_stock_products, color: SERIES.lowStock },
    { label: t('dashboard.inactiveSlice'), value: data.inactive_products, color: SERIES.inactive },
  ];

  return (
    <Card title={t('dashboard.statusTitle')} subtitle={t('dashboard.statusHint')}>
      <DonutChart
        slices={slices}
        formatValue={formatNumber}
        centerLabel={t('dashboard.totalCenter')}
      />
    </Card>
  );
}

export default function DashboardPage() {
  const user = useCurrentUser();
  const { t } = useT();
  const { data, isLoading, error } = useDashboardQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.welcome', { name: user?.full_name ?? '' })}
      />

      {isLoading && <p className="text-sm text-ink-3">{t('common.loading')}</p>}
      {error && <p className="text-danger text-sm">{errorMessage(error)}</p>}

      {data && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatTile
              label={t('dashboard.totalProducts')}
              value={formatNumber(data.total_products)}
              caption={t('dashboard.totalProductsHint')}
              icon={Package}
              tone="tone-brand"
              to="/products"
            />
            <StatTile
              label={t('dashboard.activeProducts')}
              value={formatNumber(data.active_products)}
              caption={t('dashboard.activeProductsHint')}
              icon={CircleCheck}
              tone="tone-success"
              to="/products?active_only=true"
            />
            <StatTile
              label={t('dashboard.inactiveProducts')}
              value={formatNumber(data.inactive_products)}
              caption={t('dashboard.inactiveProductsHint')}
              icon={Archive}
              tone="tone-neutral"
            />
            <StatTile
              label={t('dashboard.lowStock')}
              value={formatNumber(data.low_stock_products)}
              caption={t('dashboard.lowStockHint', { n: LOW_STOCK_THRESHOLD })}
              icon={PackageSearch}
              tone="tone-warning"
            />
            <StatTile
              label={t('dashboard.inventoryValue')}
              value={formatCurrencyCompact(data.inventory_value)}
              caption={`${formatCurrency(data.inventory_value)} · ${t('dashboard.inventoryValueHint')}`}
              icon={Wallet}
              tone="tone-violet"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <StatusCard data={data} />
            <Card
              title={t('dashboard.recentProducts')}
              padded={false}
              className="lg:col-span-2"
              actions={
                <Link to="/products" className="text-sm font-semibold text-accent hover:underline">
                  {t('common.viewAll')}
                </Link>
              }
            >
              <ProductTable rows={data.recent_products} flush compact />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
