import {Ban, Info, TriangleAlert, type LucideIcon} from 'lucide-react-native';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {Tone} from '@/core/theme/colors';
import {font} from '@/core/theme/typography';
import {useTheme} from '@/core/theme/useTheme';

const ICONS: Partial<Record<Tone, LucideIcon>> = {
  danger: Ban,
  warning: TriangleAlert,
  info: Info,
};

// Same as the web .tone-* alert: rounded-xl, ring, icon + text, optional bold title
export function Banner({
  message,
  title,
  tone = 'warning',
}: {
  message: string;
  title?: string;
  tone?: Tone;
}) {
  const {tones} = useTheme();
  const c = tones[tone];
  const Icon = ICONS[tone] ?? Info;
  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, {backgroundColor: c.bg, borderColor: c.border}]}
    >
      <Icon size={16} color={c.fg} style={styles.icon} />
      <Text style={[styles.text, font('medium'), {color: c.fg}]}>
        {title ? (
          <Text style={font('bold')}>
            {title}
            {message ? ' — ' : ''}
          </Text>
        ) : null}
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  icon: {marginTop: 1},
  text: {flex: 1, fontSize: 13, lineHeight: 18},
});
