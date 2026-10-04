import AsyncStorage from '@react-native-async-storage/async-storage';
import {createSlice, type PayloadAction} from '@reduxjs/toolkit';
import {DEFAULT_LANG, LANGS, type Lang} from '@/core/i18n/core';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface PrefsState {
  lang: Lang;
  themeMode: ThemeMode;
}

// Display preferences are not sensitive -> AsyncStorage (the token stays in Keychain/Keystore)
const STORAGE_KEY = 'prefs';
const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark'];

const initialState: PrefsState = {lang: DEFAULT_LANG, themeMode: 'system'};

const prefsSlice = createSlice({
  name: 'prefs',
  initialState,
  reducers: {
    prefsLoaded: (_state, action: PayloadAction<PrefsState>) => action.payload,
    setLang: (state, action: PayloadAction<Lang>) => {
      state.lang = action.payload;
    },
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.themeMode = action.payload;
    },
  },
});

export const {prefsLoaded, setLang, setThemeMode} = prefsSlice.actions;
export default prefsSlice.reducer;

export async function loadPrefs(): Promise<PrefsState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<PrefsState>) : {};
    return {
      lang:
        saved.lang && LANGS.includes(saved.lang)
          ? saved.lang
          : initialState.lang,
      themeMode:
        saved.themeMode && THEME_MODES.includes(saved.themeMode)
          ? saved.themeMode
          : initialState.themeMode,
    };
  } catch {
    return initialState;
  }
}

export async function savePrefs(prefs: PrefsState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Failing to persist preferences must never get in the way of using the app
  }
}
