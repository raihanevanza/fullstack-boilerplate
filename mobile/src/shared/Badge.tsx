import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {Tone} from '@/core/theme/colors';
import {font} from '@/core/theme/typography';
import {useTheme} from '@/core/theme/useTheme';

// Same as the web StatusBadge: pill + colored dot + ring. A status always comes with a text label.
export function Badge({
  label,
  tone,
  dot = true,
}: {
  label: string;
  tone: Tone;
  dot?: boolean;
}) {
  const {tones} = useTheme();
  const c = tones[tone];
  return (
    <View
      style={[styles.badge, {backgroundColor: c.bg, borderColor: c.border}]}
    >
      {dot ? <View style={[styles.dot, {backgroundColor: c.fg}]} /> : null}
      <Text
        style={[styles.text, font('semibold'), {color: c.fg}]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  dot: {width: 6, height: 6, borderRadius: 3},
  text: {fontSize: 12, lineHeight: 16},
});
