import { ToastProvider } from '@rupa-ui/react';
import { RouterProvider } from 'react-router-dom';
import { useT } from '@/i18n/useT';
import { router } from '@/routes';

// Root providers that need translations. Show a toast with useToast() or useNotify().
export default function App() {
  const { t } = useT();
  return (
    <ToastProvider label={t('common.notifications')} dismissLabel={t('common.close')}>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}
