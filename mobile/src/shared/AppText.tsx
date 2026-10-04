import React from 'react';
import {StyleSheet, Text, type TextProps} from 'react-native';
import type {Palette} from '@/core/theme/colors';
import {font, type Weight} from '@/core/theme/typography';
import {useTheme} from '@/core/theme/useTheme';

// Type scale follows the web app: page title 26 bold, card title 15 bold, uppercase label 11 semibold
type Variant =
  | 'display'
  | 'hero'
  | 'title'
  | 'heading'
  | 'body'
  | 'label'
  | 'caption'
  | 'overline';
type Color = keyof Pick<
  Palette,
  'ink' | 'ink2' | 'ink3' | 'accent' | 'danger' | 'success' | 'onPrimary'
>;

interface Props extends TextProps {
  variant?: Variant;
  color?: Color;
  // Overrides the variant's default weight
  weight?: Weight;
  // Tabular figures (amounts, quantities)
  numeric?: boolean;
}

const WEIGHT: Record<Variant, Weight> = {
  display: 'bold',
  hero: 'bold',
  title: 'bold',
  heading: 'bold',
  body: 'regular',
  label: 'medium',
  caption: 'regular',
  overline: 'semibold',
};

export function AppText({
  variant = 'body',
  color = 'ink',
  weight,
  numeric,
  style,
  ...rest
}: Props) {
  const {colors} = useTheme();
  return (
    <Text
      {...rest}
      style={[
        styles[variant],
        font(weight ?? WEIGHT[variant]),
        {color: colors[color]},
        numeric && styles.numeric,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  display: {fontSize: 26, lineHeight: 32, letterSpacing: -0.5},
  hero: {fontSize: 24, lineHeight: 30, letterSpacing: -0.5},
  title: {fontSize: 20, lineHeight: 26, letterSpacing: -0.3},
  heading: {fontSize: 15, lineHeight: 20},
  body: {fontSize: 14, lineHeight: 20},
  label: {fontSize: 13, lineHeight: 18},
  caption: {fontSize: 12, lineHeight: 16},
  overline: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  numeric: {fontVariant: ['tabular-nums']},
});
