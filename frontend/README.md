# Frontend

React web client for the boilerplate: login, dashboard and a complete products CRUD module, built against the shared API contract in [`../docs/API.md`](../docs/API.md).

- **React 18 + Vite 5 + TypeScript 5.5** (strict)
- **Tailwind CSS 3** with semantic color tokens, dark mode and the Plus Jakarta Sans font
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
├── components/     App-level components (MainLayout, PageHeader, ListToolbar, ConfirmDialog, Toaster, …)
│   ├── charts/     Hand-built SVG charts (DonutChart)
│   └── ui/         UI kit: Button, Card, Field/Input/Select/Textarea, Modal, Table, Pagination, CurrencyInput
├── demo/           In-browser mock API for demo mode (server.ts, seed.ts, store.ts, adapter.ts)
├── features/
│   ├── auth/       authSlice, RequireAuth, usePermission / useCurrentUser
│   └── ui/         uiSlice (sidebar, drawer, toasts, language), theme
├── i18n/           core.ts (translate), useT.ts (hook), id.ts (key source), en.ts
├── lib/            config (env), format (Intl formatters), notify, useListParams, useDebounced, useMediaQuery
├── pages/          LoginPage, DashboardPage, NotFoundPage, products/ (list, form, detail, schema)
├── routes/         React Router config
├── index.css       Tailwind layers + design tokens (light/dark) + .tone-* classes
└── main.tsx
```

### Conventions

- **Imports** use the `@/` alias for `src/`.
- **Colors** always come from the semantic tokens in `tailwind.config.js` / `src/index.css` (`bg-surface`, `text-ink-2`, `bg-primary`, `text-accent`, `border-line`, …), so dark mode works without `dark:` variants. Status pills use the `.tone-*` classes. Chart series use `var(--series-1…5)`, which are validated for color-vision deficiency and contrast in both themes.
- **Theme** is applied before first paint by the inline script in `index.html`; the user's choice is stored in `localStorage.theme`.
- **Permissions** come from `/api/auth/me` (`user.permissions`). Gate UI with `usePermission('product.write')`; never check role names.
- **API errors** are normalized to `{ status, code, title, message }`. The backend translates `title`/`message` using the `Accept-Language` header, so show `message` as is (`errorMessage(error)`), and use `code` to decide _where_ (e.g. `err_duplicate` → the SKU field).
- **List state** (page, search, filters) lives in the URL via `useListParams`, so lists can be linked and survive a refresh.

## How to…

### Add a page

1. Create the component in `src/pages/` (e.g. `src/pages/orders/OrderListPage.tsx`). Start with `<PageHeader>` and reuse the UI kit.
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
