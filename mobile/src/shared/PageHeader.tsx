import {ArrowLeft} from 'lucide-react-native';
import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTheme} from '@/core/theme/useTheme';
import {AppText} from './AppText';

interface Props {
  title: string;
  subtitle?: string;
  // Small back link above the title, like "← Products" on the web
  back?: {label: string; onPress: () => void};
  // Element next to the title (e.g. a status badge)
  badge?: React.ReactNode;
  // Element on the right (e.g. an action button)
  right?: React.ReactNode;
}

// Same as the web PageHeader: tight 26 bold title, 14 ink-3 subtitle
export function PageHeader({title, subtitle, back, badge, right}: Props) {
  const {colors} = useTheme();
  return (
    <View style={styles.wrap}>
      {back ? (
        <Pressable
          accessibilityRole="link"
          onPress={back.onPress}
          hitSlop={8}
          style={styles.back}
        >
          <ArrowLeft size={15} color={colors.ink3} />
          <AppText variant="body" color="ink3" weight="medium">
            {back.label}
          </AppText>
        </Pressable>
      ) : null}
      <View style={styles.row}>
        <View style={styles.titleCol}>
          <View style={styles.titleRow}>
            <AppText variant="display" accessibilityRole="header">
              {title}
            </AppText>
            {badge}
          </View>
          {subtitle ? (
            <AppText color="ink3" style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {right}
      </View>
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
  row: {flexDirection: 'row', alignItems: 'flex-end', gap: 12},
  titleCol: {flex: 1},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  subtitle: {marginTop: 4},
});
