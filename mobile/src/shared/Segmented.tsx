import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {font} from '@/core/theme/typography';
import {useTheme} from '@/core/theme/useTheme';

interface Props<T extends string> {
  options: {value: T; label: string; accessibilityLabel?: string}[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

// Segmented control like the web LanguageSwitch: surface-3 track, active option = white card + accent text
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Props<T>) {
  const {colors} = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, {backgroundColor: colors.surface3}]}
    >
      {options.map(option => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{selected: active}}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              active && [styles.active, {backgroundColor: colors.surface}],
            ]}
          >
            <Text
              style={[
                styles.label,
                font('bold'),
                {color: active ? colors.accent : colors.ink3},
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {flexDirection: 'row', borderRadius: 10, padding: 3},
  option: {
    flex: 1,
    minHeight: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  active: {boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.08)'},
  label: {fontSize: 13},
});
