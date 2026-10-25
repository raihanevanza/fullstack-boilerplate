import {
  PageHeader as RupaPageHeader,
  useTheme,
  type PageHeaderProps,
} from '@rupa-ui/react-native';
import {ArrowLeft} from 'lucide-react-native';
import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {AppText} from './AppText';

interface Props extends Omit<PageHeaderProps, 'style'> {
  // Small back link above the title, like "← Products" on the web (screens hide the native header)
  back?: {label: string; onPress: () => void};
}

// Rupa PageHeader with the screen padding and an optional back link
export function PageHeader({back, ...props}: Props) {
  const {palette} = useTheme();
  return (
    <View style={styles.wrap}>
      {back ? (
        <Pressable
          accessibilityRole="link"
          onPress={back.onPress}
          hitSlop={8}
          style={styles.back}
        >
          <ArrowLeft size={15} color={palette.ink3} />
          <AppText variant="body" color="ink3" weight="medium">
            {back.label}
          </AppText>
        </Pressable>
      ) : null}
      <RupaPageHeader {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16},
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
});
