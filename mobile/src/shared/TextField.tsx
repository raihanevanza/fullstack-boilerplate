import React, {useState} from 'react';
import {StyleSheet, TextInput, View, type TextInputProps} from 'react-native';
import {font} from '@/core/theme/typography';
import {useTheme} from '@/core/theme/useTheme';
import {AppText} from './AppText';

interface Props extends TextInputProps {
  // React 19: ref is a regular prop (no forwardRef)
  ref?: React.Ref<React.ComponentRef<typeof TextInput>>;
  label: string;
  error?: string | null;
  hint?: string;
}

// Same as the web Field: 13 medium label, rounded-xl input, accent border + ring on focus
export function TextField({
  ref,
  label,
  error,
  hint,
  style,
  multiline,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const {colors} = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.danger
    : focused
    ? colors.accent
    : colors.lineStrong;

  return (
    <View style={styles.field}>
      <AppText variant="label" color="ink2">
        {label}
      </AppText>
      <TextInput
        ref={ref}
        {...rest}
        multiline={multiline}
        accessibilityLabel={label}
        placeholderTextColor={colors.ink3}
        onFocus={e => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          font('regular'),
          multiline && styles.multiline,
          {
            color: colors.ink,
            backgroundColor: colors.surface,
            borderColor,
            boxShadow:
              focused && !error
                ? `0px 0px 0px 3px ${colors.accent}26`
                : undefined,
          },
          style,
        ]}
      />
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color="ink3">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {gap: 6},
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  multiline: {minHeight: 110, paddingTop: 12, textAlignVertical: 'top'},
});
