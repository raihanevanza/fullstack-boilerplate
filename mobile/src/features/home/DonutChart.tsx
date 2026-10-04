import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import {useTheme} from '@/core/theme/useTheme';
import {AppText} from '@/shared/AppText';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: DonutSlice[];
  formatValue: (v: number) => string;
  // Compact format for the number in the middle (little room); the legend shows full values
  formatCenter: (v: number) => string;
  centerLabel: string;
  size?: number;
}

const polar = (cx: number, cy: number, r: number, a: number) => [
  cx + r * Math.cos(a),
  cy + r * Math.sin(a),
];

function arcPath(
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a0: number,
  a1: number,
) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = polar(cx, cy, r1, a0);
  const [x1, y1] = polar(cx, cy, r1, a1);
  const [x2, y2] = polar(cx, cy, r0, a1);
  const [x3, y3] = polar(cx, cy, r0, a0);
  return `M${x0},${y0} A${r1},${r1} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 ${large} 0 ${x3},${y3} Z`;
}

// Port of the web DonutChart: part-to-whole with at most 5 segments, 2px surface-colored gaps,
// legend with value + percentage always visible. Tap a segment or legend row to highlight it.
export function DonutChart({
  slices,
  formatValue,
  formatCenter,
  centerLabel,
  size = 172,
}: Props) {
  const {colors} = useTheme();
  const [active, setActive] = useState<number | null>(null);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r1 = size / 2 - 1;
  const r0 = r1 * 0.66;

  let angle = -Math.PI / 2;
  const arcs = slices.map(slice => {
    const sweep = total ? (slice.value / total) * Math.PI * 2 : 0;
    const a0 = angle;
    angle += sweep;
    // A single full segment: shave a tiny bit off so the arc path stays valid
    return {
      ...slice,
      a0,
      a1: sweep >= Math.PI * 2 ? a0 + Math.PI * 2 - 0.0001 : angle,
    };
  });

  const focus = active !== null ? slices[active] : null;
  const pct = (v: number) =>
    total ? `${Math.round((v / total) * 100)}%` : '0%';
  const toggle = (i: number) => setActive(prev => (prev === i ? null : i));

  return (
    <View style={styles.wrap}>
      <View style={{width: size, height: size}}>
        <Svg width={size} height={size}>
          {total === 0 ? (
            <Circle
              cx={cx}
              cy={cy}
              r={(r0 + r1) / 2}
              fill="none"
              stroke={colors.chartGrid}
              strokeWidth={r1 - r0}
            />
          ) : (
            arcs.map((a, i) => (
              <Path
                key={a.label}
                d={arcPath(cx, cy, r0, r1, a.a0, a.a1)}
                fill={a.color}
                stroke={colors.surface}
                strokeWidth={2}
                opacity={active !== null && active !== i ? 0.4 : 1}
                onPress={() => toggle(i)}
              />
            ))
          )}
        </Svg>
        <View pointerEvents="none" style={styles.center}>
          <AppText
            variant="caption"
            color="ink3"
            weight="medium"
            numberOfLines={1}
          >
            {focus ? focus.label : centerLabel}
          </AppText>
          <AppText variant="heading" numeric>
            {formatCenter(focus ? focus.value : total)}
          </AppText>
          {focus ? (
            <AppText variant="caption" color="ink2" weight="semibold">
              {pct(focus.value)}
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={styles.legend}>
        {slices.map((s, i) => (
          <Pressable
            key={s.label}
            onPress={() => toggle(i)}
            accessibilityLabel={`${s.label}: ${formatValue(s.value)} (${pct(
              s.value,
            )})`}
            style={[
              styles.row,
              active === i && {backgroundColor: colors.surface3},
            ]}
          >
            <View style={[styles.swatch, {backgroundColor: s.color}]} />
            <AppText color="ink2" numberOfLines={1} style={styles.label}>
              {s.label}
            </AppText>
            <AppText color="ink2" numeric>
              {formatValue(s.value)}
            </AppText>
            <AppText weight="semibold" numeric style={styles.pct}>
              {pct(s.value)}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {alignItems: 'center', gap: 18},
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  legend: {alignSelf: 'stretch', gap: 2},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  swatch: {width: 10, height: 10, borderRadius: 3},
  label: {flex: 1},
  pct: {width: 42, textAlign: 'right'},
});
