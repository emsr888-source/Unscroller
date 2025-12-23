const path = require('path');

module.exports = {
  project: {
    android: {
      sourceDir: path.resolve(__dirname, 'apps/mobile/android'),
    },
    ios: {
      sourceDir: path.resolve(__dirname, 'apps/mobile/ios'),
    },
  },
  dependencies: {
    'react-native-webview': {
      root: path.resolve(__dirname, 'node_modules/react-native-webview'),
    },
    'react-native-screens': {
      root: path.resolve(__dirname, 'node_modules/react-native-screens'),
    },
    'react-native-safe-area-context': {
      root: path.resolve(__dirname, 'node_modules/react-native-safe-area-context'),
    },
    'react-native-reanimated': {
      root: path.resolve(__dirname, 'node_modules/react-native-reanimated'),
    },
  },
};
