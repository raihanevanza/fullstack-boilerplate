# Frontend

React web client for the boilerplate: login, dashboard and a complete products CRUD module, built against the shared API contract in [`../docs/API.md`](../docs/API.md).

- **React 18 + Vite 5 + TypeScript 5.5** (strict)
- **[Rupa](https://github.com/raihanevanza/rupa) design system** (`@rupa-ui/react` + `@rupa-ui/tokens`, violet brand): accessible components (Button, TextField, Dialog, ConfirmDialog, Table, Pagination, Toast, …), light/dark mode and the Plus Jakarta Sans font
- **Tailwind CSS 3** for layout, with the Rupa token preset (`bg-surface`, `text-ink-2`, …)
- **Redux Toolkit + RTK Query** on top of an axios base query (`Authorization` and `Accept-Language` headers, envelope unwrapping, error normalization, 401 → logout)
- **react-hook-form + yup** for forms, with schemas rebuilt per language
- **Hand-rolled i18n** (English default, Indonesian included), type-checked so a missing translation fails the build
- **Hand-built SVG charts** (no chart library) and **lucide-react** icons
- **Demo mode**: the whole app runs without a backend, with a mock API in the browser
- ESLint 9 (flat config), Prettier (+ Tailwind class sorting), lint-staged via a Husky pre-commit hook at the repo root

## Getting started

Requires Node.js 20+.

```bash
cp .env.example .env     # point VITE_API_BASE_URL at your backend
npm install
npm run dev              # http://localhost:5173
```

No backend yet? Run the demo instead:

```bash
npm run dev:demo
```

Dev accounts (seeded by `db/init/02_seed_dev.sql`, password `Password123!`): `admin@example.com` (can edit products) and `staff@example.com` (read only). In dev and demo builds the login page shows them as cards you can click to fill in the form.

## Scripts

| Script               | What it does                                                   |
| -------------------- | -------------------------------------------------------------- |
| `npm run dev`        | Vite dev server against the real API (`VITE_API_BASE_URL`)     |
| `npm run dev:demo`   | Dev server in demo mode (mock API in the browser, `.env.demo`) |
| `npm run build`      | Type-check and build to `dist/`                                |
| `npm run build:demo` | Same, in demo mode (deployable as a static site)               |
| `npm run preview`    | Serve the last build locally                                   |
| `npm run typecheck`  | `tsc -b` (also catches missing translation keys)               |
| `npm run lint`       | ESLint; `lint:fix` to auto-fix                                 |
| `npm run format`     | Prettier write; `format:check` to verify only                  |

`npm install` also runs `prepare`, which installs the Husky hook from the repository root (`../.husky/pre-commit` runs `lint-staged` here). It needs the repository to be a git repo; outside one it prints a harmless warning.

## Environment variables

All variables are read at build time (Vite `VITE_*`). See `.env.example`.

| Variable                  | Default       | Description                                                                                                                         |
| ------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`       | (required)    | Backend base URL including `/api`, e.g. `http://localhost:8080/api`                                                                 |
| `VITE_APP_NAME`           | `Boilerplate` | Name in the sidebar, login page and browser tab                                                                                     |
| `VITE_CURRENCY`           | `IDR`         | ISO 4217 code used to format prices                                                                                                 |
| `VITE_SHOW_DEMO_ACCOUNTS` | (auto)        | Demo-account cards on the login page. Shown in `npm run dev` and demo builds, hidden in production builds; `true`/`false` forces it |
| `VITE_DEMO_MODE`          | `false`       | `true` answers the API in the browser (`src/demo`). Set by `.env.demo`                                                              |

## Project structure

```
src/
├── api/            RTK Query: baseApi.ts (axios base query, tags), one file per resource
│                   (auth.ts, dashboard.ts, products.ts), client.ts (axios + interceptors), types.ts
├── app/            Redux store and typed hooks
├── components/     App-level components (MainLayout, ListToolbar, LanguageSwitch, DemoBadge, Logo, …)
│   ├── charts/     Hand-built SVG charts (DonutChart)
│   └── ui/         Thin wrappers that give Rupa components the app's translations (Dialog, ConfirmDialog,
│                   Pagination) and CurrencyInput (a Rupa TextField for money)
├── demo/           In-browser mock API for demo mode (server.ts, seed.ts, store.ts, adapter.ts)
├── features/
│   ├── auth/       authSlice, RequireAuth, usePermission / useCurrentUser
│   └── ui/         uiSlice (sidebar, drawer, language), theme (light/dark toggle)
├── i18n/           core.ts (translate), useT.ts (hook), id.ts (key source), en.ts
├── lib/            config (env), format (Intl formatters), notify (mutation + toast), useListParams, useDebounced, useMediaQuery
├── pages/          LoginPage, DashboardPage, NotFoundPage, products/ (list, form, detail, schema)
├── routes/         React Router config
├── styles/         preflight.css (Tailwind base, loaded before the Rupa styles)
├── index.css       Tailwind components + utilities (loaded after the Rupa styles)
└── main.tsx
```

### Conventions

- **Imports** use the `@/` alias for `src/`.
- **UI** comes from `@rupa-ui/react` first ([Storybook](https://raihan-evanza-rupa.vercel.app) lists every component). Pass the translated text for built-in labels (`closeLabel`, `cancelLabel`, `requiredLabel`, `retryLabel`, …), or use the wrappers in `components/ui` that already do. Write your own markup only for app-specific layout.
- **Colors** always come from the Rupa tokens, through the Tailwind preset (`bg-surface`, `text-ink-2`, `bg-primary`, `text-accent`, `border-line`, `bg-success-soft`, …) or `var(--rupa-color-*)`, so dark mode works without `dark:` variants. Chart series use `var(--rupa-color-series-1…5)`, validated for color-vision deficiency and contrast in every brand and mode.
- **CSS order** is set in `main.tsx`: Tailwind preflight → Rupa styles → Tailwind utilities, so preflight never resets a Rupa component and a utility class can still adjust one.
- **Brand and theme** are attributes on `<html>`: change `data-brand` in `index.html` to switch the whole palette (`violet`, `signal`, `latte`, `ledger`, `mono`). `data-theme` is set before first paint by the inline script in `index.html` (`system` until the user picks light or dark, stored in `localStorage.theme`).
- **Toasts**: `useToast().show({ tone, title })` from Rupa, or `useNotify()` to run a mutation and toast the result.
- **Permissions** come from `/api/auth/me` (`user.permissions`). Gate UI with `usePermission('product.write')`; never check role names.
- **API errors** are normalized to `{ status, code, title, message }`. The backend translates `title`/`message` using the `Accept-Language` header, so show `message` as is (`errorMessage(error)`), and use `code` to decide _where_ (e.g. `err_duplicate` → the SKU field).
- **List state** (page, search, filters) lives in the URL via `useListParams`, so lists can be linked and survive a refresh.

## How to…

### Add a page

1. Create the component in `src/pages/` (e.g. `src/pages/orders/OrderListPage.tsx`). Start with Rupa's `<PageHeader>` and build the page from Rupa components.
2. Register the route in `src/routes/index.tsx` as a child of the `MainLayout` route (it is then behind `RequireAuth`).
3. Add a nav link in the `sections` array of `src/components/MainLayout.tsx` and its label key (see below).

### Add an API endpoint

1. Add request/response types to `src/api/types.ts` (keep them in sync with `docs/API.md`).
2. Create `src/api/<resource>.ts` and inject endpoints into the shared slice:

   ```ts
   import { baseApi, cleanParams } from '@/api/baseApi';
   import type { ListParams, Paginated, Order } from '@/api/types';

   export const ordersApi = baseApi.injectEndpoints({
     endpoints: (build) => ({
       orders: build.query<Paginated<Order>, ListParams>({
         query: (params) => ({ url: '/orders', params: cleanParams(params) }),
         providesTags: ['Order'],
       }),
     }),
   });

   export const { useOrdersQuery } = ordersApi;
   ```

3. Add any new tag (`'Order'`) to `tagTypes` in `src/api/baseApi.ts` and invalidate it from your mutations.
4. If you want the endpoint in demo mode too, handle the route in `src/demo/server.ts` (and seed data in `src/demo/seed.ts`; bump `DB_VERSION` in `src/demo/store.ts` when the shape changes).

For mutations, `useNotify()` runs the request and shows a success or error toast.

### Add a translation key

1. Add the key to `src/i18n/id.ts` (the key source).
2. Add the same key to `src/i18n/en.ts`. `npm run typecheck` fails until every language has it.
3. Use it with `const { t } = useT(); t('orders.title')`. Placeholders use `{name}`: `t('dashboard.welcome', { name })`.

Validation schemas that use `t` are built with a factory inside `useMemo(() => makeSchema(t), [t])`, so messages switch language with the UI. Numbers, money and dates go through `src/lib/format.ts`, which follows the active language.

To add a language, add a dictionary file typed `Record<TKey, string>`, register it in `src/i18n/core.ts` (`Lang`, `dictionaries`, `localeOf`) and in `src/components/LanguageSwitch.tsx`.

## Demo mode

`npm run dev:demo` and `npm run build:demo` load `.env.demo` (`VITE_DEMO_MODE=true`). The axios instance then swaps its adapter for `src/demo/adapter.ts`, and every request is answered by `src/demo/server.ts`, which follows the same contract: the `{ error, message, data }` envelope, status codes, error codes, translated messages, permissions, validation, duplicate SKU (409), soft delete and pagination.

- Data is seeded from `src/demo/seed.ts` (same accounts as the dev database) and persisted per visitor in `localStorage`. The **Reset data** button in the header restores the seed.
- The demo code is loaded with a dynamic import behind an inline `import.meta.env.VITE_DEMO_MODE` check, so normal builds do not contain it.
- `vercel.json` rewrites all routes to `index.html`, so a demo build can be deployed to Vercel (or any static host with an SPA fallback) as is: set the build command to `npm run build:demo` and the output directory to `dist`.
