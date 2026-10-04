import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: { to: string; label: string };
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, back, actions }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <Link
            to={back.to}
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-accent"
          >
            <ArrowLeft size={15} /> {back.label}
          </Link>
        )}
        <h2 className="text-[26px] font-bold tracking-tight text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-3">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
