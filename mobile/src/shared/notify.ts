import {Alert, Platform, ToastAndroid} from 'react-native';

// Short confirmation after a successful action
export function notify(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert(message);
  }
}
