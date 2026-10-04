import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {font} from '@/core/theme/typography';
import {useTheme} from '@/core/theme/useTheme';

// Same variants as the web button
type Variant = 'primary' | 'secondary' | 'danger' | 'success';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  style,
}: Props) {
  const {colors} = useTheme();
  const inactive = disabled || loading;

  const palette = {
    primary: {
      bg: colors.primary,
      pressed: '#5835BE',
      fg: '#FFFFFF',
      border: colors.primary,
    },
    secondary: {
      bg: colors.surface,
      pressed: colors.surface2,
      fg: colors.ink,
      border: colors.line,
    },
    danger: {
      bg: '#E11D48',
      pressed: '#BE123C',
      fg: '#FFFFFF',
      border: '#E11D48',
    },
    success: {
      bg: '#059669',
      pressed: '#047857',
      fg: '#FFFFFF',
      border: '#059669',
    },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled: !!inactive, busy: !!loading}}
      disabled={inactive}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        {
          backgroundColor: pressed ? palette.pressed : palette.bg,
          borderColor: palette.border,
        },
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, font('semibold'), {color: palette.fg}]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    flexDirection: 'row',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
  },
  disabled: {opacity: 0.5},
  label: {fontSize: 15},
});
