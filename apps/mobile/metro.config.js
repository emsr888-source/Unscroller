const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(workspaceRoot, 'packages'),
  workspaceRoot,
  path.resolve(workspaceRoot, 'policy'),
];

const resolver = config.resolver || {};

resolver.nodeModulesPaths = [
  ...((resolver.nodeModulesPaths || [])),
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

resolver.extraNodeModules = {
  ...(resolver.extraNodeModules || {}),
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  '@babel/runtime': path.resolve(workspaceRoot, 'node_modules/@babel/runtime'),
};

resolver.alias = {
  ...(resolver.alias || {}),
  '@': path.resolve(projectRoot, 'src'),
  '@store': path.resolve(projectRoot, 'src/store'),
  '@services': path.resolve(projectRoot, 'src/services'),
  '@components': path.resolve(projectRoot, 'src/components'),
  '@screens': path.resolve(projectRoot, 'src/screens'),
  '@navigation': path.resolve(projectRoot, 'src/navigation'),
  '@utils': path.resolve(projectRoot, 'src/utils'),
  '@types': path.resolve(projectRoot, 'src/types'),
};

config.resolver = resolver;

module.exports = config;
