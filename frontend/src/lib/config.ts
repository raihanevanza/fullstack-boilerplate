// Build-time configuration from Vite env vars (see .env.example)
const env = import.meta.env;

export const APP_NAME = env.VITE_APP_NAME?.trim() || 'Boilerplate';

export const CURRENCY = env.VITE_CURRENCY?.trim() || 'IDR';

// Demo mode: the API is answered in the browser (src/demo). The code that loads src/demo checks
// import.meta.env.VITE_DEMO_MODE inline so normal builds drop the demo chunk entirely.
export const DEMO_MODE = env.VITE_DEMO_MODE === 'true';

// Demo-account cards on the login page: shown in dev and demo builds unless forced via env
export const SHOW_DEMO_ACCOUNTS =
  env.VITE_SHOW_DEMO_ACCOUNTS === 'true' ||
  (env.VITE_SHOW_DEMO_ACCOUNTS !== 'false' && (env.DEV || DEMO_MODE));

// Mirrors LOW_STOCK_THRESHOLD in the backend; only used to badge rows in the product list
export const LOW_STOCK_THRESHOLD = 10;

export const DEMO_PASSWORD = 'Password123!';
