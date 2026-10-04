import {Platform} from 'react-native';

export type EnvName = 'development' | 'production';

interface Env {
  name: EnvName;
  apiBaseUrl: string;
  // Tappable demo-account cards on the login screen (never enable in production)
  showDemoAccounts: boolean;
}

// The Android emulator reaches the host machine through 10.0.2.2; the iOS simulator can use localhost.
// For a physical device on the same network, use your machine's LAN IP (e.g. http://192.168.1.10:8080/api),
// or run `adb reverse tcp:8080 tcp:8080` on Android and keep localhost.
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

const ENVS: Record<EnvName, Env> = {
  development: {
    name: 'development',
    apiBaseUrl: `http://${DEV_HOST}:8080/api`,
    showDemoAccounts: true,
  },
  // TODO: set your production API URL before shipping a release build
  production: {
    name: 'production',
    apiBaseUrl: 'https://api.example.com/api',
    showDemoAccounts: false,
  },
};

export const env: Env = __DEV__ ? ENVS.development : ENVS.production;
