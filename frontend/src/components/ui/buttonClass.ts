export type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white shadow-sm hover:bg-primary-hover',
  secondary: 'border border-line bg-surface text-ink shadow-sm hover:bg-surface-2',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
  success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
  ghost: 'text-ink-2 hover:bg-surface-3 hover:text-ink',
};

export const buttonClass = (variant: Variant = 'primary', size: 'sm' | 'md' = 'md') =>
  `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50 ${
    size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm'
  } ${variants[variant]}`;
