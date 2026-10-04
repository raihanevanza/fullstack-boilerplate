import { Link } from 'react-router-dom';
import { useT } from '@/i18n/useT';

export default function NotFoundPage() {
  const { t } = useT();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-canvas px-6 text-center">
      <p className="text-6xl font-bold tracking-tight text-accent">404</p>
      <p className="text-ink-2">{t('notFound.text')}</p>
      <Link to="/" className="mt-2 text-sm font-semibold text-accent hover:underline">
        {t('notFound.back')}
      </Link>
    </div>
  );
}
