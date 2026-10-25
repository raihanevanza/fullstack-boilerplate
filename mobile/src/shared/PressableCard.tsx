import {Card, useTheme, type CardProps} from '@rupa-ui/react-native';
import React from 'react';
import {Pressable, StyleSheet} from 'react-native';

interface Props extends CardProps {
  onPress?: () => void;
  accessibilityLabel?: string;
}

// A Rupa Card that opens something: the whole card is one button, its border lights up on press
export function PressableCard({
  onPress,
  accessibilityLabel,
  style,
  ...props
}: Props) {
  const {palette} = useTheme();
  if (!onPress) {
    return <Card style={style} {...props} />;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={style}
    >
      {({pressed}) => (
        <Card
          {...props}
          style={[styles.fill, pressed && {borderColor: palette.accentLine}]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({fill: {flexGrow: 1}});
