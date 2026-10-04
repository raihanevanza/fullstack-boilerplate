import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Sun,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { baseApi } from '@/api/baseApi';
import DemoBadge from '@/components/DemoBadge';
import LanguageSwitch from '@/components/LanguageSwitch';
import Logo from '@/components/Logo';
import Toaster from '@/components/Toaster';
import { loggedOut } from '@/features/auth/authSlice';
import { useCurrentUser } from '@/features/auth/usePermission';
import { useTheme } from '@/features/ui/theme';
import { setDrawerOpen, toggleSidebar } from '@/features/ui/uiSlice';
import type { TKey } from '@/i18n/core';
import { useT } from '@/i18n/useT';
import { DEMO_MODE } from '@/lib/config';
import { useMediaQuery } from '@/lib/useMediaQuery';

interface NavItem {
  to: string;
  labelKey: TKey;
  icon: LucideIcon;
  end?: boolean;
}

// Add a page: create it under src/pages, register it in src/routes, then link it here
const sections: { titleKey: TKey; links: NavItem[] }[] = [
  {
    titleKey: 'nav.overview',
    links: [{ to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    titleKey: 'nav.catalog',
    links: [{ to: '/products', labelKey: 'nav.products', icon: Package }],
  },
];

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export default function MainLayout() {
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const drawerOpen = useAppSelector((state) => state.ui.drawerOpen);
  const user = useCurrentUser();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const { t } = useT();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  // The icon-only sidebar exists on desktop only; the mobile drawer is always full width
  const expanded = !isDesktop || sidebarOpen;

  const closeDrawer = () => dispatch(setDrawerOpen(false));

  // Close the drawer after navigating
  useEffect(() => {
    dispatch(setDrawerOpen(false));
  }, [location.pathname, dispatch]);

  // Escape closes the drawer
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dispatch(setDrawerOpen(false));
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, dispatch]);

  const logout = () => {
    dispatch(loggedOut());
    dispatch(baseApi.util.resetApiState());
    navigate('/login', { replace: true });
  };

  const itemClass = (active: boolean) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      active ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:bg-surface-3 hover:text-ink'
    } ${expanded ? '' : 'justify-center'}`;

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {/* Mobile backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#120e24]/40 backdrop-blur-[2px] lg:hidden"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 shrink-0 flex-col border-r border-line bg-surface transition-[transform,width] duration-200 lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 ${
          drawerOpen ? 'translate-x-0 shadow-pop' : '-translate-x-full max-lg:invisible'
        } ${sidebarOpen ? 'lg:w-64' : 'lg:w-[76px]'}`}
      >
        <div
          className={`flex items-center px-5 pb-4 pt-6 ${expanded ? 'justify-between' : 'justify-center'}`}
        >
          <Logo compact={!expanded} />
          {isDesktop
            ? expanded && (
                <button
                  type="button"
                  onClick={() => dispatch(toggleSidebar())}
                  aria-label={t('nav.collapse')}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:bg-surface-3 hover:text-ink"
                >
                  <ChevronsLeft size={18} />
                </button>
              )
            : drawerOpen && (
                <button
                  type="button"
                  onClick={closeDrawer}
                  aria-label={t('nav.closeMenu')}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:bg-surface-3 hover:text-ink"
                >
                  <X size={18} />
                </button>
              )}
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
          {!expanded && (
            <button
              type="button"
              onClick={() => dispatch(toggleSidebar())}
              aria-label={t('nav.expand')}
              className="mx-auto grid h-9 w-9 place-items-center rounded-lg text-ink-3 hover:bg-surface-3 hover:text-ink"
            >
              <ChevronsRight size={18} />
            </button>
          )}
          {sections.map((section) => (
            <div key={section.titleKey}>
              {expanded && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
                  {t(section.titleKey)}
                </p>
              )}
              <div className="space-y-0.5">
                {section.links.map(({ to, labelKey, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    title={expanded ? undefined : t(labelKey)}
                    className={({ isActive }) => itemClass(isActive)}
                  >
                    <Icon size={18} strokeWidth={2} className="shrink-0" />
                    {expanded && <span className="truncate">{t(labelKey)}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t border-line px-3 py-4">
          <LanguageSwitch compact={!expanded} />
          <button
            type="button"
            onClick={toggle}
            className={`${itemClass(false)} w-full`}
            aria-pressed={theme === 'dark'}
            title={expanded ? undefined : theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {expanded && <span>{theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}</span>}
          </button>

          {user && (
            <div
              className={`flex items-center gap-3 rounded-xl px-2 py-2.5 ${expanded ? '' : 'justify-center'}`}
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#A48BF5] to-[#6A46D6] text-sm font-bold text-white"
                title={user.full_name}
              >
                {initials(user.full_name)}
              </span>
              {expanded && (
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {user.full_name}
                  </span>
                  <span className="block truncate text-xs text-ink-3">{user.role_name}</span>
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={logout}
            className={`${itemClass(false)} w-full`}
            title={expanded ? undefined : t('nav.logout')}
          >
            <LogOut size={18} />
            {expanded && <span>{t('nav.logout')}</span>}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        {/* Top bar: menu button on mobile, demo badge when in demo mode */}
        <header
          className={`sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur ${
            DEMO_MODE ? '' : 'lg:hidden'
          }`}
        >
          <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-10">
            <button
              type="button"
              onClick={() => dispatch(setDrawerOpen(true))}
              aria-label={t('nav.openMenu')}
              aria-controls="app-sidebar"
              aria-expanded={drawerOpen}
              className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-2 hover:bg-surface-3 hover:text-ink lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="lg:hidden">
              <Logo compact />
            </div>
            {DEMO_MODE && (
              <div className="min-w-0 flex-1 lg:flex-none">
                <DemoBadge />
              </div>
            )}
          </div>
        </header>
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
