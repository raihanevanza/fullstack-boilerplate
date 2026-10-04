import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AppText} from './AppText';

export type InfoItem = [label: string, value: React.ReactNode];

// Same as the web InfoList: small uppercase label above the value, 2-column grid
export function InfoList({items}: {items: InfoItem[]}) {
  return (
    <View style={styles.grid}>
      {items.map(([label, value]) => (
        <View key={label} style={styles.cell}>
          <AppText variant="overline" color="ink3">
            {label}
          </AppText>
          {typeof value === 'string' || typeof value === 'number' ? (
            <AppText style={styles.value}>{value === '' ? '-' : value}</AppText>
          ) : (
            <View style={styles.value}>{value ?? <AppText>-</AppText>}</View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {flexDirection: 'row', flexWrap: 'wrap', rowGap: 16, columnGap: 16},
  cell: {width: '47%', flexGrow: 1},
  value: {marginTop: 4},
});
