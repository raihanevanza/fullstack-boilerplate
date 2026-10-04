import React from 'react';
import {StyleSheet, type StyleProp, type ViewStyle} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '@/core/theme/useTheme';

// Page background (canvas) + top inset. Screens draw their own title with PageHeader
// instead of the native navigation header, so they look like the web app.
export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const {colors} = useTheme();
  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.flex, {backgroundColor: colors.canvas}, style]}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({flex: {flex: 1}});
