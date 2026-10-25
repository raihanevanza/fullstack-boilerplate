import rupa from '@rupa-ui/tokens/tailwind/preset';

/** @type {import('tailwindcss').Config} */
// Colors, radius, shadows and the font come from the Rupa tokens (CSS variables), so brand and
// light/dark are set once with data-brand / data-theme on <html>.
export default {
  presets: [rupa],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  plugins: [],
};
