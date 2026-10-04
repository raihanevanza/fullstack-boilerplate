import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {cardShadow} from '@/core/theme/typography';
import {useTheme} from '@/core/theme/useTheme';
import {AppText} from './AppText';

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  // Small element to the right of the title (e.g. a button)
  actions?: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

// Same as the web Card: rounded-2xl, line border, shadow-card, 15 bold title + 12 subtitle
export function Card({
  children,
  title,
  subtitle,
  actions,
  onPress,
  accessibilityLabel,
  style,
}: Props) {
  const theme = useTheme();
  const {colors} = theme;
  const base = [
    styles.card,
    {
      backgroundColor: colors.surface,
      borderColor: colors.line,
      boxShadow: cardShadow(theme),
    },
    style,
  ];

  const content = (
    <>
      {title ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="heading">{title}</AppText>
            {subtitle ? (
              <AppText variant="caption" color="ink3">
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {actions}
        </View>
      ) : null}
      {children}
    </>
  );

  if (!onPress) {
    return <View style={base}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({pressed}) => [
        ...base,
        pressed && {borderColor: colors.accentLine},
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {borderRadius: 16, borderWidth: 1, padding: 18},
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  headerText: {flex: 1, gap: 2},
});
