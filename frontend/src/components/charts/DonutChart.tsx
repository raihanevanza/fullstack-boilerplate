import { useState } from 'react';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: DonutSlice[];
  formatValue: (v: number) => string;
  // Compact format for the number in the center (little room); full values are in the legend
  formatCenter?: (v: number) => string;
  centerLabel: string;
  size?: number;
}

const polar = (cx: number, cy: number, r: number, a: number) => [
  cx + r * Math.cos(a),
  cy + r * Math.sin(a),
];

function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = polar(cx, cy, r1, a0);
  const [x1, y1] = polar(cx, cy, r1, a1);
  const [x2, y2] = polar(cx, cy, r0, a1);
  const [x3, y3] = polar(cx, cy, r0, a0);
  return `M${x0},${y0} A${r1},${r1} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 ${large} 0 ${x3},${y3} Z`;
}

// Part-to-whole for up to 6 slices. Slices are separated by a 2px surface-colored gap;
// the legend with values is always visible (identity never relies on color alone).
export default function DonutChart({
  slices,
  formatValue,
  formatCenter = formatValue,
  centerLabel,
  size = 172,
}: Props) {
  const [active, setActive] = useState<number | null>(null);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r1 = size / 2;
  const r0 = r1 * 0.66;

  let angle = -Math.PI / 2;
  const arcs = slices.map((slice) => {
    const sweep = total ? (slice.value / total) * Math.PI * 2 : 0;
    const a0 = angle;
    angle += sweep;
    // A single full slice: stop just short of 360° so the arc path stays valid
    return { ...slice, a0, a1: sweep >= Math.PI * 2 ? a0 + Math.PI * 2 - 0.0001 : angle };
  });

  const focus = active !== null ? slices[active] : null;
  const pct = (v: number) => (total ? `${Math.round((v / total) * 100)}%` : '0%');

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          role="img"
          aria-label={`${centerLabel} ${formatValue(total)}`}
        >
          {total === 0 ? (
            <circle
              cx={cx}
              cy={cy}
              r={(r0 + r1) / 2}
              fill="none"
              stroke="var(--chart-grid)"
              strokeWidth={r1 - r0}
            />
          ) : (
            arcs.map((a, i) => (
              <path
                key={a.label}
                d={arcPath(cx, cy, r0, r1, a.a0, a.a1)}
                fill={a.color}
                stroke="rgb(var(--surface))"
                strokeWidth={2}
                opacity={active !== null && active !== i ? 0.4 : 1}
                style={{ transition: 'opacity 120ms' }}
                tabIndex={0}
                role="button"
                aria-label={`${a.label}: ${formatValue(a.value)} (${pct(a.value)})`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="outline-none"
              />
            ))
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[11px] font-medium text-ink-3">
              {focus ? focus.label : centerLabel}
            </p>
            <p className="text-base font-bold text-ink">
              {formatCenter(focus ? focus.value : total)}
            </p>
            {focus && <p className="text-xs font-semibold text-ink-2">{pct(focus.value)}</p>}
          </div>
        </div>
      </div>

      <ul className="w-full space-y-1 text-sm">
        {slices.map((s, i) => (
          <li
            key={s.label}
            className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 ${active === i ? 'bg-surface-3' : ''}`}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: s.color }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-ink-2" title={s.label}>
              {s.label}
            </span>
            <span className="shrink-0 text-ink-2">{formatValue(s.value)}</span>
            <span className="w-10 shrink-0 text-right font-semibold text-ink">{pct(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
