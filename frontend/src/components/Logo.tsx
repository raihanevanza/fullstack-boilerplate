import LogoMark from '@/components/LogoMark';
import { useT } from '@/i18n/useT';
import { APP_NAME } from '@/lib/config';

export default function Logo({ compact = false }: { compact?: boolean }) {
  const { t } = useT();
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-hover to-primary text-on-primary shadow-card">
        <LogoMark />
      </span>
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-lg font-bold tracking-tight text-ink">
            {APP_NAME}
          </span>
          <span className="block text-[11px] font-medium text-ink-3">{t('app.tagline')}</span>
        </span>
      )}
    </div>
  );
}
