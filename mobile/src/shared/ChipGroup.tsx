import React, {useEffect, useRef} from 'react';
import {Pressable, ScrollView, StyleSheet, Text} from 'react-native';
import {font} from '@/core/theme/typography';
import {useTheme} from '@/core/theme/useTheme';

export interface ChipOption<T> {
  value: T;
  label: string;
}

interface Props<T> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // false = render inline without horizontal scrolling (for a few options)
  scroll?: boolean;
}

// Pill-shaped choices; the active one uses the soft accent like the active web sidebar item
const keyOf = (v: unknown) => String(v ?? 'all');

export function ChipGroup<T extends string | number | undefined>({
  options,
  value,
  onChange,
  scroll = true,
}: Props<T>) {
  const {colors} = useTheme();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  // x position of every chip, used to scroll the active chip into view
  const positions = useRef(new Map<string, number>());

  useEffect(() => {
    const x = positions.current.get(keyOf(value));
    if (scroll && x !== undefined) {
      scrollRef.current?.scrollTo({x: Math.max(0, x - 16), animated: true});
    }
  }, [value, scroll]);

  const chips = options.map(option => {
    const active = option.value === value;
    return (
      <Pressable
        key={keyOf(option.value)}
        onLayout={e =>
          positions.current.set(keyOf(option.value), e.nativeEvent.layout.x)
        }
        accessibilityRole="radio"
        accessibilityState={{selected: active}}
        onPress={() => onChange(option.value)}
        style={[
          styles.chip,
          active
            ? {
                backgroundColor: colors.accentSoft,
                borderColor: colors.accentLine,
              }
            : {backgroundColor: colors.surface, borderColor: colors.line},
        ]}
      >
        <Text
          style={[
            styles.label,
            font(active ? 'semibold' : 'medium'),
            {color: active ? colors.accent : colors.ink2},
          ]}
        >
          {option.label}
        </Text>
      </Pressable>
    );
  });

  if (!scroll) {
    return <>{chips}</>;
  }
  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="radiogroup"
    >
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {gap: 8, paddingHorizontal: 16},
  chip: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  label: {fontSize: 13},
});
