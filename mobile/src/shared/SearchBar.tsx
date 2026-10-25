import {TextField, useTheme} from '@rupa-ui/react-native';
import {Search, X} from 'lucide-react-native';
import React, {useEffect, useState} from 'react';
import {Pressable} from 'react-native';
import {useT} from '@/core/i18n/useT';

interface Props {
  placeholder: string;
  // Called once the user stops typing (debounced)
  onSearch: (value: string) => void;
  delayMs?: number;
}

const searchIcon = (color: string) => <Search size={18} color={color} />;

// Rupa TextField with a search icon, a clear button and a debounced callback
export function SearchBar({placeholder, onSearch, delayMs = 350}: Props) {
  const {t} = useT();
  const {palette} = useTheme();
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value.trim()), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs, onSearch]);

  return (
    <TextField
      label={placeholder}
      hideLabel
      value={value}
      onChangeText={setValue}
      placeholder={placeholder}
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="search"
      prefix={searchIcon}
      suffix={
        value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.clear')}
            hitSlop={12}
            onPress={() => setValue('')}
          >
            <X size={18} color={palette.ink3} />
          </Pressable>
        ) : undefined
      }
    />
  );
}
