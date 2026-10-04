import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import React, {useEffect, useMemo} from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import {useTheme} from '@/core/theme/useTheme';
import {bootstrap} from './bootstrap';
import {useAppDispatch, useAppSelector} from './hooks';
import {RootNavigator} from './navigation/RootNavigator';
import {store} from './store';

function Root() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(state => state.session.status);
  const theme = useTheme();
  const {colors} = theme;

  useEffect(() => {
    dispatch(bootstrap());
  }, [dispatch]);

  const navTheme = useMemo(() => {
    const base = theme.dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accent,
        background: colors.canvas,
        card: colors.surface,
        text: colors.ink,
        border: colors.line,
        notification: colors.danger,
      },
    };
  }, [theme.dark, colors]);

  return (
    <>
      {/* Android edge-to-edge: the status bar is transparent, only the icon color is set */}
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      {status === 'restoring' ? (
        <View style={[styles.splash, {backgroundColor: colors.canvas}]}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <NavigationContainer theme={navTheme}>
          <RootNavigator />
        </NavigationContainer>
      )}
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <Root />
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  splash: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});
