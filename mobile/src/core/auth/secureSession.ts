import * as Keychain from 'react-native-keychain';
import type {User} from '@/core/api/types';

// The session lives in the Keychain (iOS) / Keystore (Android), never in AsyncStorage.
// The user profile is stored too, so the app still opens when the server is unreachable.
export interface StoredSession {
  token: string;
  expiresAt: string;
  user: User;
}

// Change this together with the bundle id when you fork the boilerplate
const SERVICE = 'com.example.boilerplate.session';

export async function readSession(): Promise<StoredSession | null> {
  try {
    const credentials = await Keychain.getGenericPassword({service: SERVICE});
    if (!credentials) {
      return null;
    }
    const parsed = JSON.parse(credentials.password) as StoredSession;
    return parsed.token && parsed.expiresAt && parsed.user ? parsed : null;
  } catch {
    // Corrupt data or a rotated Keystore key (e.g. after a backup restore): treat as signed out
    return null;
  }
}

export async function writeSession(session: StoredSession) {
  await Keychain.setGenericPassword('session', JSON.stringify(session), {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearSession() {
  try {
    await Keychain.resetGenericPassword({service: SERVICE});
  } catch {
    // Nothing to remove
  }
}
