import { Platform } from 'react-native';
import { isExpoGo } from './isExpoGo';

// Expo Go ships with UIViewControllerBasedStatusBarAppearance = NO, so any attempt
// to change the status bar style crashes. This safely no-ops the native setter on iOS
// when running inside Expo Go so screens can render without throwing.
export function patchExpoGoStatusBar() {
  if (!isExpoGo || Platform.OS !== 'ios') {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const NativeStatusBarManagerIOS = require('react-native/Libraries/Components/StatusBar/NativeStatusBarManagerIOS');
  const noop = () => {};

  if (NativeStatusBarManagerIOS?.setStyle) {
    NativeStatusBarManagerIOS.setStyle = noop;
  }
  if (NativeStatusBarManagerIOS?.setHidden) {
    NativeStatusBarManagerIOS.setHidden = noop;
  }
}
