module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./apps/mobile/src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './apps/mobile/src',
            '@components': './apps/mobile/src/components',
            '@screens': './apps/mobile/src/screens',
            '@navigation': './apps/mobile/src/navigation',
            '@store': './apps/mobile/src/store',
            '@services': './apps/mobile/src/services',
            '@utils': './apps/mobile/src/utils',
            '@types': './apps/mobile/src/types',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
