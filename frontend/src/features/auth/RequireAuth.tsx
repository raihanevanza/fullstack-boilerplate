import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useMeQuery } from '@/api/auth';
import { userLoaded } from '@/features/auth/authSlice';
import { useT } from '@/i18n/useT';

// Requires a token and a loaded user profile (with permissions) before rendering the page
export default function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { t } = useT();
  const { data, isError, refetch } = useMeQuery(undefined, { skip: !token || !!user });

  useEffect(() => {
    if (data) dispatch(userLoaded(data));
  }, [data, dispatch]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-ink-3">
        {isError ? t('auth.profileFailed') : t('common.loading')}
        {isError && (
          <button
            type="button"
            onClick={() => refetch()}
            className="font-semibold text-accent hover:underline"
          >
            {t('common.retry')}
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
