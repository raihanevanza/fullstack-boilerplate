import { FlaskConical, RotateCcw } from 'lucide-react';
import { useT } from '@/i18n/useT';

// Demo-mode marker in the header, plus a button that restores the sample data
export default function DemoBadge() {
  const { t } = useT();

  const reset = async () => {
    // Inlined env check: keeps the demo chunk out of normal builds
    if (import.meta.env.VITE_DEMO_MODE !== 'true' || !window.confirm(t('demo.resetConfirm'))) {
      return;
    }
    const { resetDb } = await import('@/demo/store');
    resetDb();
    window.location.reload();
  };

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="tone-warning flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset">
        <FlaskConical size={14} aria-hidden="true" />
        {t('demo.badge')}
      </span>
      <span className="hidden truncate text-xs text-ink-3 md:inline">{t('demo.note')}</span>
      <button
        type="button"
        onClick={reset}
        className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-ink-2 hover:bg-surface-3 hover:text-ink"
      >
        <RotateCcw size={14} aria-hidden="true" />
        {t('demo.reset')}
      </button>
    </div>
  );
}
