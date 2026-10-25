import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import {Spinner, ThemeProvider, useTheme} from '@rupa-ui/react-native';
import React, {useEffect, useMemo} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import {bootstrap} from './bootstrap';
import {useAppDispatch, useAppSelector} from './hooks';
import {RootNavigator} from './navigation/RootNavigator';
import {store} from './store';

// Rupa brand of the app (violet, signal, latte, ledger, mono). Every color comes from it.
const BRAND = 'violet';

function Root() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(state => state.session.status);
  const {palette, resolvedMode} = useTheme();
  const dark = resolvedMode === 'dark';

  useEffect(() => {
    dispatch(bootstrap());
  }, [dispatch]);

  const navTheme = useMemo(() => {
    const base = dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: palette.accent,
        background: palette.canvas,
        card: palette.surface,
        text: palette.ink,
        border: palette.line,
        notification: palette.danger,
      },
    };
  }, [dark, palette]);

  return (
    <>
      {/* Android edge-to-edge: the status bar is transparent, only the icon color is set */}
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      {status === 'restoring' ? (
        <View style={[styles.splash, {backgroundColor: palette.canvas}]}>
          <Spinner size="lg" label={null} />
        </View>
      ) : (
        <NavigationContainer theme={navTheme}>
          <RootNavigator />
        </NavigationContainer>
      )}
    </>
  );
}

// The theme mode is a saved preference (Profile → Theme), so the provider is controlled by it
function Themed() {
  const mode = useAppSelector(state => state.prefs.themeMode);
  return (
    <ThemeProvider defaultBrand={BRAND} mode={mode}>
      <Root />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <Themed />
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  splash: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});
