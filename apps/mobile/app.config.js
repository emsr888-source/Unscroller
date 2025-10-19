module.exports = {
  name: 'Creator Mode',
  slug: 'creator-mode',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.creatormode.app',
    buildNumber: '1',
    infoPlist: {
      NSCameraUsageDescription: 'This app does not use the camera.',
      NSMicrophoneUsageDescription: 'This app does not use the microphone.',
    },
  },
  android: {
    package: 'com.creatormode.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000',
    },
  },
  plugins: [
    'expo-dev-client',
  ],
  extra: {
    eas: {
      projectId: 'your-eas-project-id',
    },
  },
};
