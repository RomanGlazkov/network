const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const NodemonPlugin = require('nodemon-webpack-plugin');

const common = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};

const frontend = {
  entry: './src/client/ts/frontend.ts',
  output: {
    filename: 'frontend.js',
    path: path.resolve(__dirname, 'dist', 'client'),
  },
  plugins: [
    new HTMLWebpackPlugin({
      template: './src/client/index.html',
    }),
  ],
};

const backend = {
  target: 'node',
  entry: './src/subscriber.ts',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [new NodemonPlugin()],
};

module.exports = [Object.assign({}, common, frontend), Object.assign({}, common, backend)];
