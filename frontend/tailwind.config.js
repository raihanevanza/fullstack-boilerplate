/** @type {import('tailwindcss').Config} */

// Semantic colors come from CSS variables (src/index.css), so light/dark is defined in one place
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        'surface-3': token('surface-3'),
        line: token('line'),
        'line-strong': token('line-strong'),
        ink: token('ink'),
        'ink-2': token('ink-2'),
        'ink-3': token('ink-3'),
        primary: token('primary'),
        'primary-hover': token('primary-hover'),
        accent: token('accent'),
        'accent-soft': token('accent-soft'),
        'accent-line': token('accent-line'),
      },
      boxShadow: {
        card: '0 1px 2px rgb(var(--shadow) / 0.04), 0 4px 16px -4px rgb(var(--shadow) / 0.06)',
        pop: '0 12px 40px -8px rgb(var(--shadow) / 0.25)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
    },
  },
  plugins: [],
};
