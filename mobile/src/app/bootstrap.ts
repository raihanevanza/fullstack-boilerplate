import {restoreSession} from '@/core/auth/session';
import {loadPrefs, prefsLoaded} from '@/core/prefs/prefsSlice';
import type {AppThunk} from './store';

// Startup order: preferences first (the language is sent with every request), then the session
export const bootstrap = (): AppThunk<Promise<void>> => async dispatch => {
  dispatch(prefsLoaded(await loadPrefs()));
  await dispatch(restoreSession());
};
