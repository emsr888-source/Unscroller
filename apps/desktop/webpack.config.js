const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/renderer/app.ts',
  target: 'electron-renderer',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist/renderer'),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/renderer/domScript.js',
          to: 'domScript.js',
        },
        {
          from: '../../branding/png/unscroller-logo-512.png',
          to: 'icon.png',
        },
        {
          from: '../../branding/png/unscroller-logo-64.png',
          to: 'favicon.png',
        },
      ],
    }),
  ],
};
