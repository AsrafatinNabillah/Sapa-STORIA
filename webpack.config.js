const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/Sapa-STORIA/'
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.js$/i,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
      test: /\.ico$/,
      use: ['file-loader'],
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new MiniCssExtractPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/Screenshots/ScreenshotDesktop.png', to: 'ScreenshotDesktop.png'},
        { from: './src/Screenshots/ScreenshotMobile.png', to: 'ScreenshotMobile.png'},
        { from: './src/manifest.json', to: 'manifest.json'},
        { from: './src/icons/S-96.png', to: 'S-96.png' },
        { from: './src/icons/S-192.png', to: 'S-192.png' },
        { from: './src/icons/S-512.png', to: 'S-512.png' },
        { from: './src/sw.js', to: 'sw.js' },
        { from: './src/S.ico', to: 'S.ico' },
        { from: './src/404.html', to: '404.html'}
      ]
    }),
  ],
  devServer: {
    static: './dist',
    open: true,
  },
  mode: 'development',
};
