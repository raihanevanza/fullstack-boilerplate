import { yupResolver } from '@hookform/resolvers/yup';
import { Alert, Badge, Button, TextField, type BadgeTone } from '@rupa-ui/react';
import { ChartColumn, Check, History, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router-dom';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useLoginMutation } from '@/api/auth';
import { errorMessage } from '@/api/baseApi';
import LanguageSwitch from '@/components/LanguageSwitch';
import Logo from '@/components/Logo';
import LogoMark from '@/components/LogoMark';
import { loggedIn } from '@/features/auth/authSlice';
import type { TKey } from '@/i18n/core';
import { useT, type TFunction } from '@/i18n/useT';
import { APP_NAME, DEMO_MODE, DEMO_PASSWORD, SHOW_DEMO_ACCOUNTS } from '@/lib/config';

// Schema factory: rebuilt when the language changes so messages follow it
const makeSchema = (t: TFunction) =>
  yup.object({
    email: yup.string().trim().required(t('login.emailRequired')).email(t('login.emailInvalid')),
    password: yup.string().required(t('login.passwordRequired')),
  });

type LoginValues = yup.InferType<ReturnType<typeof makeSchema>>;

// Dev accounts seeded by db/init/02_seed_dev.sql (and by the demo mock API)
const demoAccounts: { email: string; name: string; role: TKey; access: TKey; tone: BadgeTone }[] = [
  {
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'login.role.admin',
    access: 'login.access.admin',
    tone: 'accent',
  },
  {
    email: 'staff@example.com',
    name: 'Staff User',
    role: 'login.role.staff',
    access: 'login.access.staff',
    tone: 'info',
  },
];

const features: [typeof ShieldCheck, TKey][] = [
  [ShieldCheck, 'login.feature1'],
  [History, 'login.feature2'],
  [ChartColumn, 'login.feature3'],
];

export default function LoginPage() {
  const token = useAppSelector((state) => state.auth.token);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [login, { isLoading, error }] = useLoginMutation();
  const { t } = useT();
  const schema = useMemo(() => makeSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    watch,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: yupResolver(schema) });
  const selectedEmail = watch('email');

  const fillAccount = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', DEMO_PASSWORD, { shouldValidate: true });
    setFocus('password');
  };

  // The only redirect after login: back to the page the user came from (if any)
  if (token) return <Navigate to={from && !from.startsWith('/login') ? from : '/'} replace />;

  const onSubmit = async (values: LoginValues) => {
    const res = await login(values);
    if (res.data) {
      dispatch(
        loggedIn({
          token: res.data.access_token,
          expiresAt: res.data.expires_at,
          user: res.data.user,
        }),
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Brand panel */}
      <aside className="relative hidden w-[44%] overflow-hidden bg-gradient-to-br from-primary-hover to-primary p-12 text-on-primary lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-on-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-on-primary/15 ring-1 ring-on-primary/25 backdrop-blur">
            <LogoMark />
          </span>
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            {t('login.heroTitle')}
          </h1>
          <p className="mt-4 text-base text-on-primary/75">{t('login.heroText')}</p>
          <ul className="mt-8 space-y-3 text-sm text-on-primary/85">
            {features.map(([Icon, key]) => (
              <li key={key} className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-on-primary/10 ring-1 ring-on-primary/20">
                  <Icon size={16} />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-on-primary/60">{t('login.footer')}</p>
      </aside>

      {/* Form */}
      <main className="relative flex flex-1 items-center justify-center px-6 pb-10 pt-20 sm:py-10">
        <div className="absolute right-6 top-6 w-40">
          <LanguageSwitch />
        </div>
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-[28px] font-bold tracking-tight text-ink">{t('login.title')}</h2>
          <p className="mt-1 text-sm text-ink-3">{t('login.subtitle')}</p>
          {DEMO_MODE && (
            <Alert tone="warning" className="mt-5">
              {t('demo.loginNotice')}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-4">
            <TextField
              label={t('login.email')}
              error={errors.email?.message}
              type="email"
              autoComplete="username"
              autoFocus
              placeholder={t('login.emailPlaceholder')}
              {...register('email')}
            />
            <TextField
              label={t('login.password')}
              error={errors.password?.message}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
            />
            {error && (
              <Alert tone="danger" live>
                {errorMessage(error)}
              </Alert>
            )}
            <Button type="submit" variant="primary" loading={isLoading} block>
              {t('login.submit')}
            </Button>
          </form>

          {SHOW_DEMO_ACCOUNTS && (
            <div className="mt-8">
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <p className="text-xs font-semibold text-ink-3">{t('login.demoTitle')}</p>
                <span className="h-px flex-1 bg-line" />
              </div>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {demoAccounts.map((acc) => {
                  const selected = selectedEmail === acc.email;
                  return (
                    <li key={acc.email}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => fillAccount(acc.email)}
                        className={`relative flex h-full w-full flex-col items-start gap-1.5 rounded-xl border bg-surface p-3 text-left shadow-sm transition-colors ${
                          selected
                            ? 'border-accent ring-4 ring-accent/15'
                            : 'border-line hover:border-accent-line hover:bg-surface-2'
                        }`}
                      >
                        <Badge tone={acc.tone} size="sm">
                          {t(acc.role)}
                        </Badge>
                        <span className="text-sm font-semibold text-ink">{acc.name}</span>
                        <span className="w-full truncate text-xs text-ink-3">{acc.email}</span>
                        <span className="text-xs text-ink-2">{t(acc.access)}</span>
                        {selected && (
                          <Check size={16} className="absolute right-3 top-3 text-accent" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-center text-xs text-ink-3">
                {t('login.demoPassword')}{' '}
                <code className="rounded bg-surface-3 px-1.5 py-0.5 text-ink-2">
                  {DEMO_PASSWORD}
                </code>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
