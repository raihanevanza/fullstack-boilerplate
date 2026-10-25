import { Badge, Button } from '@rupa-ui/react';
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
      <Badge tone="warning" className="shrink-0">
        <FlaskConical size={14} aria-hidden="true" />
        {t('demo.badge')}
      </Badge>
      <span className="hidden truncate text-xs text-ink-3 md:inline">{t('demo.note')}</span>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0"
        iconStart={<RotateCcw size={14} aria-hidden="true" />}
        onClick={reset}
      >
        {t('demo.reset')}
      </Button>
    </div>
  );
}
