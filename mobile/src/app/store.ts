import {
  combineReducers,
  configureStore,
  createListenerMiddleware,
  isAnyOf,
  type ThunkAction,
  type UnknownAction,
} from '@reduxjs/toolkit';
import {api} from '@/core/api/api';
import {clearSession} from '@/core/auth/secureSession';
import session, {signedOut} from '@/core/auth/sessionSlice';
import prefs, {savePrefs, setLang, setThemeMode} from '@/core/prefs/prefsSlice';

const rootReducer = combineReducers({
  session,
  prefs,
  [api.reducerPath]: api.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

const listener = createListenerMiddleware();

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefault =>
    getDefault().prepend(listener.middleware).concat(api.middleware),
});

export type AppDispatch = typeof store.dispatch;
export type AppThunk<R = void> = ThunkAction<
  R,
  RootState,
  unknown,
  UnknownAction
>;

const startAppListening = listener.startListening.withTypes<
  RootState,
  AppDispatch
>();

startAppListening({
  matcher: isAnyOf(setLang, setThemeMode),
  effect: (_action, listenerApi) => savePrefs(listenerApi.getState().prefs),
});

// Sign-out (manual, 401 or expired token): drop the stored token and every cached response of this account
startAppListening({
  actionCreator: signedOut,
  effect: async (_action, listenerApi) => {
    listenerApi.dispatch(api.util.resetApiState());
    await clearSession();
  },
});
