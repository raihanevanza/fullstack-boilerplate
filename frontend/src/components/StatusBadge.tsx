import type { ReactNode } from 'react';

// Tone classes are defined in src/index.css (light & dark). They are listed literally so
// Tailwind keeps them in the build.
const tones = {
  neutral: 'tone-neutral',
  brand: 'tone-brand',
  success: 'tone-success',
  warning: 'tone-warning',
  danger: 'tone-danger',
  info: 'tone-info',
  violet: 'tone-violet',
} as const;

export type Tone = keyof typeof tones;

// Pill with a dot; always carries a text label, never color alone
export default function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`${tones[tone]} inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}
