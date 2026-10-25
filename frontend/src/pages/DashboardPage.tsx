import {
  Archive,
  CircleCheck,
  Package,
  PackageSearch,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Card, PageHeader, StateView } from '@rupa-ui/react';
import { Link } from 'react-router-dom';
import { errorMessage } from '@/api/baseApi';
import { useDashboardQuery } from '@/api/dashboard';
import type { Dashboard } from '@/api/types';
import DonutChart from '@/components/charts/DonutChart';
import ProductTable from '@/pages/products/ProductTable';
import { useCurrentUser } from '@/features/auth/usePermission';
import { useT } from '@/i18n/useT';
import { formatCurrency, formatCurrencyCompact, formatNumber } from '@/lib/format';
import { LOW_STOCK_THRESHOLD } from '@/lib/config';

// Rupa chart series slots, validated for color-vision deficiency and contrast in every brand and
// mode. Each slot follows its entity, never its rank.
const SERIES = {
  inStock: 'var(--rupa-color-series-1)',
  inactive: 'var(--rupa-color-series-2)',
  lowStock: 'var(--rupa-color-series-3)',
};

// Icon tile colors per tone, from the Rupa tokens
const TONES = {
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success-ink',
  neutral: 'bg-surface-3 text-ink-2',
  warning: 'bg-warning-soft text-warning-ink',
  info: 'bg-info-soft text-info-ink',
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
  tone: keyof typeof TONES;
  to?: string;
}) {
  const body = (
    <>
      <div className="flex items-center gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${TONES[tone]}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
        <p className="text-sm font-medium text-ink-2">{label}</p>
      </div>
      <div>
        <p className="truncate text-[28px] font-bold leading-none tracking-tight text-ink">
          {value}
        </p>
        <p className="mt-2 text-xs text-ink-3">{caption}</p>
      </div>
    </>
  );
  return to ? (
    <Link
      to={to}
      className="group block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <Card className="h-full transition-[border-color,box-shadow] group-hover:border-line-strong group-hover:shadow-pop">
        {body}
      </Card>
    </Link>
  ) : (
    <Card className="h-full">{body}</Card>
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
    <Card title={t('dashboard.statusTitle')} description={t('dashboard.statusHint')}>
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
  const { data, isLoading, error, refetch } = useDashboardQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.welcome', { name: user?.full_name ?? '' })}
        className="mb-6"
      />

      {isLoading && <StateView state="loading" title={t('common.loading')} description={null} />}
      {error && (
        <StateView
          state="error"
          title={t('common.failed')}
          description={errorMessage(error)}
          retryLabel={t('common.retry')}
          onRetry={refetch}
        />
      )}

      {data && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatTile
              label={t('dashboard.totalProducts')}
              value={formatNumber(data.total_products)}
              caption={t('dashboard.totalProductsHint')}
              icon={Package}
              tone="accent"
              to="/products"
            />
            <StatTile
              label={t('dashboard.activeProducts')}
              value={formatNumber(data.active_products)}
              caption={t('dashboard.activeProductsHint')}
              icon={CircleCheck}
              tone="success"
              to="/products?active_only=true"
            />
            <StatTile
              label={t('dashboard.inactiveProducts')}
              value={formatNumber(data.inactive_products)}
              caption={t('dashboard.inactiveProductsHint')}
              icon={Archive}
              tone="neutral"
            />
            <StatTile
              label={t('dashboard.lowStock')}
              value={formatNumber(data.low_stock_products)}
              caption={t('dashboard.lowStockHint', { n: LOW_STOCK_THRESHOLD })}
              icon={PackageSearch}
              tone="warning"
            />
            <StatTile
              label={t('dashboard.inventoryValue')}
              value={formatCurrencyCompact(data.inventory_value)}
              caption={`${formatCurrency(data.inventory_value)} · ${t('dashboard.inventoryValueHint')}`}
              icon={Wallet}
              tone="info"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <StatusCard data={data} />
            <Card
              title={t('dashboard.recentProducts')}
              padding="none"
              className="overflow-hidden lg:col-span-2"
              actions={
                <Link to="/products" className="text-sm font-semibold text-accent hover:underline">
                  {t('common.viewAll')}
                </Link>
              }
            >
              <ProductTable
                rows={data.recent_products}
                caption={t('dashboard.recentProducts')}
                flush
                compact
              />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
