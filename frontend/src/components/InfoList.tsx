import type { ReactNode } from 'react';

export default function InfoList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{label}</dt>
          <dd className="mt-1 text-ink">{value ?? '-'}</dd>
        </div>
      ))}
    </dl>
  );
}
