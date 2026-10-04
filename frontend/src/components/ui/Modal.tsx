import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useT } from '@/i18n/useT';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}

export default function Modal({ open, title, onClose, children, footer, size = 'md' }: Props) {
  const { t } = useT();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[#120e24]/40 p-4 pt-16 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full rounded-2xl border border-line bg-surface shadow-pop ${size === 'lg' ? 'max-w-3xl' : 'max-w-lg'}`}
      >
        <div className="flex items-center justify-between px-6 pb-2 pt-5">
          <h3 className="text-base font-bold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:bg-surface-3 hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-3">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 pb-5 pt-3">{footer}</div>}
      </div>
    </div>
  );
}
