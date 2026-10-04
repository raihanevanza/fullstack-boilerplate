import React from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Defs, G, LinearGradient, Path, Rect, Stop} from 'react-native-svg';
import {useT} from '@/core/i18n/useT';
import {AppText} from './AppText';

// App name shown next to the mark. Replace it (and the mark) when you fork the boilerplate.
export const APP_NAME = 'Boilerplate';

// Violet gradient tile with a white box outline
export function LogoMark({size = 36, glass}: {size?: number; glass?: boolean}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Defs>
        <LinearGradient id="logo" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#8468E8" />
          <Stop offset="1" stopColor="#5835BE" />
        </LinearGradient>
      </Defs>
      <Rect
        width={36}
        height={36}
        rx={12}
        fill={glass ? 'rgba(255,255,255,0.14)' : 'url(#logo)'}
        stroke={glass ? 'rgba(255,255,255,0.25)' : undefined}
        strokeWidth={glass ? 1 : 0}
      />
      {/* 24x24 box glyph scaled into the middle of the tile */}
      <G
        transform="translate(8 8) scale(0.8333)"
        fill="none"
        stroke="#fff"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <Path d="m3.3 7 8.7 5 8.7-5" />
        <Path d="M12 22V12" />
      </G>
    </Svg>
  );
}

export function Logo({onDark}: {onDark?: boolean}) {
  const {t} = useT();
  return (
    <View style={styles.row}>
      <LogoMark glass={onDark} />
      <View>
        <AppText
          variant="title"
          color={onDark ? 'onPrimary' : 'ink'}
          style={styles.name}
        >
          {APP_NAME}
        </AppText>
        {!onDark ? (
          <AppText variant="caption" color="ink3" weight="medium">
            {t('app.tagline')}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 10},
  name: {fontSize: 18, lineHeight: 22},
});
