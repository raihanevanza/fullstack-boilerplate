import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '@/api/baseApi';
import { setUnauthorizedHandler } from '@/api/client';
import authReducer, { loggedOut } from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
});

// 401 from any request: drop the session and cached data; RequireAuth then redirects to /login
setUnauthorizedHandler(() => {
  store.dispatch(loggedOut());
  store.dispatch(baseApi.util.resetApiState());
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
