import {Search, X} from 'lucide-react-native';
import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, TextInput, View} from 'react-native';
import {useT} from '@/core/i18n/useT';
import {font} from '@/core/theme/typography';
import {useTheme} from '@/core/theme/useTheme';

interface Props {
  placeholder: string;
  // Called once the user stops typing (debounced)
  onSearch: (value: string) => void;
  delayMs?: number;
}

export function SearchBar({placeholder, onSearch, delayMs = 350}: Props) {
  const {colors} = useTheme();
  const {t} = useT();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value.trim()), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs, onSearch]);

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderColor: focused ? colors.accent : colors.line,
          boxShadow: focused ? `0px 0px 0px 3px ${colors.accent}26` : undefined,
        },
      ]}
    >
      <Search size={18} color={colors.ink3} />
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor={colors.ink3}
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, font('regular'), {color: colors.ink}]}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.clear')}
          hitSlop={12}
          onPress={() => setValue('')}
        >
          <X size={18} color={colors.ink3} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  input: {flex: 1, fontSize: 14, paddingVertical: 8},
});
