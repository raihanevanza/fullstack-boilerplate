import type {AppThunk} from '@/app/store';
import {ApiError, ERR_USER_INACTIVE, request} from '@/core/api/http';
import type {LoginResponse, User} from '@/core/api/types';
import {readSession, writeSession} from './secureSession';
import {
  isExpired,
  signedIn,
  signedOut,
  userRefreshed,
  type SignOutNotice,
} from './sessionSlice';

export const login =
  (email: string, password: string): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const resp = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: {email: email.trim(), password},
      lang: getState().prefs.lang,
    });
    const session = {
      token: resp.access_token,
      expiresAt: resp.expires_at,
      user: resp.user,
    };
    await writeSession(session);
    dispatch(signedIn(session));
  };

// Errors from /auth/me that end the session (anything else keeps the stored profile)
function endingNotice(err: unknown): SignOutNotice | undefined {
  if (!(err instanceof ApiError)) {
    return undefined;
  }
  if (err.data.kind === 'unauthenticated') {
    return 'expired';
  }
  if (err.data.code === ERR_USER_INACTIVE) {
    return 'inactive';
  }
  return undefined;
}

// Runs on app start. The first sign-in must be online; afterwards a stored session opens even
// when the server is unreachable, as long as the token has not expired.
export const restoreSession =
  (): AppThunk<Promise<void>> => async (dispatch, getState) => {
    const stored = await readSession();
    if (!stored) {
      dispatch(signedOut());
      return;
    }
    if (isExpired(stored.expiresAt)) {
      dispatch(signedOut('expired'));
      return;
    }

    let user: User;
    try {
      user = await request<User>('/auth/me', {
        token: stored.token,
        lang: getState().prefs.lang,
      });
    } catch (err) {
      const notice = endingNotice(err);
      if (notice) {
        dispatch(signedOut(notice));
        return;
      }
      // Network or server trouble: open with the stored profile; data screens show an error + retry
      dispatch(signedIn(stored));
      return;
    }

    // Role and permissions may have changed since the last sign-in
    const session = {...stored, user};
    await writeSession(session);
    dispatch(signedIn(session));
  };

// Re-reads /auth/me (e.g. pull-to-refresh on the profile) so permission changes apply without re-login
export const refreshUser =
  (): AppThunk<Promise<void>> => async (dispatch, getState) => {
    const {session, prefs} = getState();
    if (session.status !== 'signedIn' || !session.token) {
      return;
    }
    try {
      const user = await request<User>('/auth/me', {
        token: session.token,
        lang: prefs.lang,
      });
      dispatch(userRefreshed(user));
      await writeSession({
        token: session.token,
        expiresAt: session.expiresAt ?? '',
        user,
      });
    } catch (err) {
      const notice = endingNotice(err);
      if (notice) {
        dispatch(signedOut(notice));
      }
    }
  };

// The API has no logout endpoint (stateless JWT): dropping the local session is enough
export const logout = (): AppThunk => dispatch => {
  dispatch(signedOut());
};
