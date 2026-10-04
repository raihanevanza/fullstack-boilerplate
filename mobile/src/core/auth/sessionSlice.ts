import {createSlice, type PayloadAction} from '@reduxjs/toolkit';
import type {Permission, User} from '@/core/api/types';

export type SessionStatus = 'restoring' | 'signedOut' | 'signedIn';

// Why the last session ended; shown once on the login screen
export type SignOutNotice = 'expired' | 'inactive' | null;

export interface SessionState {
  status: SessionStatus;
  token: string | null;
  expiresAt: string | null;
  user: User | null;
  notice: SignOutNotice;
}

const initialState: SessionState = {
  status: 'restoring',
  token: null,
  expiresAt: null,
  user: null,
  notice: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    signedIn: (
      _state,
      action: PayloadAction<{token: string; expiresAt: string; user: User}>,
    ) => ({
      status: 'signedIn',
      ...action.payload,
      notice: null,
    }),
    userRefreshed: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    // Fired by a manual logout as well as by a 401 / expired token; the store listener clears
    // the Keychain entry and the API cache
    signedOut: (_state, action: PayloadAction<SignOutNotice | undefined>) => ({
      ...initialState,
      status: 'signedOut',
      notice: action.payload ?? null,
    }),
    noticeCleared: state => {
      state.notice = null;
    },
  },
});

export const {signedIn, userRefreshed, signedOut, noticeCleared} =
  sessionSlice.actions;
export default sessionSlice.reducer;

// Permissions come from /api/auth/me; the app never hard-codes roles
export const hasPermission = (
  user: User | null | undefined,
  permission: Permission,
) => !!user?.permissions?.includes(permission);

export const isExpired = (expiresAt: string, now = Date.now()) =>
  new Date(expiresAt).getTime() <= now;
