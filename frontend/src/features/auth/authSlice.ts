import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { TOKEN_EXPIRES_KEY, TOKEN_KEY } from '@/api/client';
import type { User } from '@/api/types';

interface AuthState {
  token: string | null;
  user: User | null;
}

function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_KEY);
}

// Restore the token from a previous visit unless it has already expired
function storedToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAt = Date.parse(localStorage.getItem(TOKEN_EXPIRES_KEY) ?? '');
    if (token && !(expiresAt <= Date.now())) return token;
    clearStoredToken();
  } catch {
    // Storage blocked: start logged out
  }
  return null;
}

const initialState: AuthState = {
  token: storedToken(),
  // Loaded from /api/auth/me by RequireAuth
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loggedIn(state, action: PayloadAction<{ token: string; expiresAt: string; user: User }>) {
      localStorage.setItem(TOKEN_KEY, action.payload.token);
      localStorage.setItem(TOKEN_EXPIRES_KEY, action.payload.expiresAt);
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    userLoaded(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    loggedOut(state) {
      clearStoredToken();
      state.token = null;
      state.user = null;
    },
  },
});

export const { loggedIn, userLoaded, loggedOut } = authSlice.actions;
export default authSlice.reducer;
