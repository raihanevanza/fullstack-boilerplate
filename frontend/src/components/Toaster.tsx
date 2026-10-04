import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { dismissToast, type Toast } from '@/features/ui/uiSlice';
import { useT } from '@/i18n/useT';

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  const { t } = useT();
  const success = toast.type === 'success';

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), 4500);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id]);

  return (
    <div
      role={success ? 'status' : 'alert'}
      className="flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-pop"
    >
      {success ? (
        <CircleCheck size={18} className="text-success mt-0.5 shrink-0" />
      ) : (
        <CircleAlert size={18} className="text-danger mt-0.5 shrink-0" />
      )}
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        aria-label={t('common.close')}
        className="text-ink-3 hover:text-ink"
        onClick={() => dispatch(dismissToast(toast.id))}
      >
        <X size={16} />
      </button>
    </div>
  );
}

// Rendered once in MainLayout; show a toast with dispatch(showToast(...)) or useNotify()
export default function Toaster() {
  const toasts = useAppSelector((state) => state.ui.toasts);
  return (
    <div className="fixed inset-x-4 bottom-5 z-50 flex flex-col gap-2 sm:left-auto sm:right-5 sm:w-80">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
