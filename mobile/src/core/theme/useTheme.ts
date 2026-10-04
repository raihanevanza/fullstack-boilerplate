import {useColorScheme} from 'react-native';
import {useAppSelector} from '@/app/hooks';
import {darkTheme, lightTheme, type Theme} from './colors';

export function useTheme(): Theme {
  const mode = useAppSelector(state => state.prefs.themeMode);
  const system = useColorScheme();
  const dark = mode === 'dark' || (mode === 'system' && system === 'dark');
  return dark ? darkTheme : lightTheme;
}
