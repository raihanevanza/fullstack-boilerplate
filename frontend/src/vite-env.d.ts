/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // Shown in the sidebar, login page and browser tab (default "Boilerplate")
  readonly VITE_APP_NAME?: string;
  // ISO 4217 code used to format prices (default "IDR")
  readonly VITE_CURRENCY?: string;
  // 'true' / 'false' forces the demo-account cards on the login page on or off
  readonly VITE_SHOW_DEMO_ACCOUNTS?: string;
  // 'true' = demo mode: mock data in the browser, no backend (see src/demo)
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
