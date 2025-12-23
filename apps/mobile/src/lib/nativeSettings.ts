import { Alert, Linking, Platform } from 'react-native';

export const openScreenTimeSettings = async () => {
  if (Platform.OS !== 'ios') {
    Linking.openSettings().catch(() => {
      Alert.alert('Open Settings', 'Go to Settings → Screen Time to manage permissions.');
    });
    return;
  }

  const candidates = ['App-Prefs:root=SCREEN_TIME&path=CONTENT_PRIVACY', 'App-Prefs:root=SCREEN_TIME', 'App-Prefs:'];
  for (const url of candidates) {
    const supported = await Linking.canOpenURL(url).catch(() => false);
    if (supported) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Screen Time', 'Open Settings → Screen Time → Content & Privacy to continue.');
      });
      return;
    }
  }

  Alert.alert('Unavailable', 'Open Settings → Screen Time → Content & Privacy Restrictions manually to configure blocking.');
};

export const openDigitalWellbeingSettings = async () => {
  if (Platform.OS !== 'android') {
    Linking.openSettings().catch(() => {
      Alert.alert('Open Settings', 'Go to Settings → Digital Wellbeing to manage blocking.');
    });
    return;
  }

  const action = 'android.settings.DIGITAL_WELLBEING_SETTINGS';
  try {
    const androidSendIntent = (Linking as unknown as { sendIntent?: (intent: string) => Promise<void> }).sendIntent;
    if (androidSendIntent) {
      await androidSendIntent(action);
      return;
    }
  } catch {
    /* continue to fallback */
  }

  Linking.openSettings().catch(() => {
    Alert.alert('Open Digital Wellbeing', 'Go to Settings → Digital Wellbeing & parental controls to finish setup.');
  });
};

export const openSystemBlockingSettings = async () => {
  if (Platform.OS === 'ios') {
    await openScreenTimeSettings();
  } else {
    await openDigitalWellbeingSettings();
  }
};
