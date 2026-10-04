// Color tokens shared with the web app (frontend) so both clients feel like one product.
// Update both places when the palette changes.
export interface Palette {
  canvas: string;
  surface: string;
  surface2: string;
  surface3: string;
  line: string;
  lineStrong: string;
  ink: string;
  ink2: string;
  ink3: string;
  primary: string;
  onPrimary: string;
  accent: string;
  accentSoft: string;
  accentLine: string;
  success: string;
  danger: string;
  // Chart series, fixed order: violet, teal, amber, rose, sky (validated for CVD and contrast)
  series: [string, string, string, string, string];
  seriesOther: string;
  chartGrid: string;
}

export type Tone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'violet';

export interface ToneColors {
  bg: string;
  fg: string;
  border: string;
}

export interface Theme {
  dark: boolean;
  colors: Palette;
  tones: Record<Tone, ToneColors>;
}

const lightColors: Palette = {
  canvas: '#F6F5FB',
  surface: '#FFFFFF',
  surface2: '#FAF9FE',
  surface3: '#F0EDFA',
  line: '#E9E6F3',
  lineStrong: '#D6D1E8',
  ink: '#1D1A2E',
  ink2: '#4E4A63',
  ink3: '#807C96',
  primary: '#6A46D6',
  onPrimary: '#FFFFFF',
  accent: '#6A46D6',
  accentSoft: '#F1EDFD',
  accentLine: '#CDC1F6',
  success: '#059669',
  danger: '#E11D48',
  series: ['#6A46D6', '#0E9F8E', '#C98A00', '#E0607E', '#3B8FE0'],
  seriesOther: '#B4B0C6',
  chartGrid: '#EEECF5',
};

const darkColors: Palette = {
  canvas: '#0F0D17',
  surface: '#17151F',
  surface2: '#1D1A28',
  surface3: '#262235',
  line: '#2E2A3F',
  lineStrong: '#3E3954',
  ink: '#F2F0FA',
  ink2: '#BDB8D1',
  ink3: '#8B86A3',
  primary: '#7C5CE6',
  onPrimary: '#FFFFFF',
  accent: '#A792F6',
  accentSoft: '#261F42',
  accentLine: '#483A80',
  success: '#34D399',
  danger: '#FB7185',
  series: ['#8468E8', '#149C8B', '#B67E00', '#D9577A', '#3A86D8'],
  seriesOther: '#5C5775',
  chartGrid: '#2A2638',
};

// Same as the web .tone-* classes (Tailwind emerald/amber/rose/sky/violet)
const lightTones: Record<Tone, ToneColors> = {
  neutral: {
    bg: lightColors.surface3,
    fg: lightColors.ink2,
    border: lightColors.lineStrong,
  },
  brand: {
    bg: lightColors.accentSoft,
    fg: lightColors.accent,
    border: lightColors.accentLine,
  },
  success: {bg: '#ECFDF5', fg: '#047857', border: '#A7F3D0'},
  warning: {bg: '#FFFBEB', fg: '#92400E', border: '#FDE68A'},
  danger: {bg: '#FFF1F2', fg: '#BE123C', border: '#FECDD3'},
  info: {bg: '#F0F9FF', fg: '#0369A1', border: '#BAE6FD'},
  violet: {bg: '#F5F3FF', fg: '#6D28D9', border: '#DDD6FE'},
};

const darkTones: Record<Tone, ToneColors> = {
  neutral: {
    bg: darkColors.surface3,
    fg: darkColors.ink2,
    border: darkColors.lineStrong,
  },
  brand: {
    bg: darkColors.accentSoft,
    fg: darkColors.accent,
    border: darkColors.accentLine,
  },
  success: {
    bg: 'rgba(52,211,153,0.10)',
    fg: '#6EE7B7',
    border: 'rgba(52,211,153,0.25)',
  },
  warning: {
    bg: 'rgba(251,191,36,0.10)',
    fg: '#FCD34D',
    border: 'rgba(251,191,36,0.25)',
  },
  danger: {
    bg: 'rgba(251,113,133,0.10)',
    fg: '#FDA4AF',
    border: 'rgba(251,113,133,0.25)',
  },
  info: {
    bg: 'rgba(56,189,248,0.10)',
    fg: '#7DD3FC',
    border: 'rgba(56,189,248,0.25)',
  },
  violet: {
    bg: 'rgba(167,139,250,0.10)',
    fg: '#C4B5FD',
    border: 'rgba(167,139,250,0.25)',
  },
};

export const lightTheme: Theme = {
  dark: false,
  colors: lightColors,
  tones: lightTones,
};
export const darkTheme: Theme = {
  dark: true,
  colors: darkColors,
  tones: darkTones,
};
