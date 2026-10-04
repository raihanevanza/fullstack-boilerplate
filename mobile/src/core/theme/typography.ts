import type {TextStyle} from 'react-native';
import type {Theme} from './colors';

// Plus Jakarta Sans, the same font as the web app (bundled from assets/fonts, OFL licensed).
// Android picks custom fonts by file name, so every weight is its own family.
// Never combine with fontWeight (Android may synthesize a double bold).
export type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

const FAMILY: Record<Weight, string> = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
};

export const font = (weight: Weight = 'regular'): TextStyle => ({
  fontFamily: FAMILY[weight],
});

export const fontFamily = (weight: Weight = 'regular') => FAMILY[weight];

// Same as the web `shadow-card`: two very soft violet-tinted layers. No shadow in dark mode.
export const cardShadow = (theme: Theme) =>
  theme.dark
    ? undefined
    : '0px 1px 2px rgba(46, 31, 107, 0.04), 0px 4px 16px -4px rgba(46, 31, 107, 0.08)';
