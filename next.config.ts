import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const webpack = require('webpack')
const nextConfig = {
  reactStrictMode: true,
  // turbopackは使用せず、webpackのみを使用
  turbo: {
    // Turbopack コンパイラを明示的に無効化
    enabled: false
  },
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // WebAssemblyの置換設定
    config.plugins.push(new webpack.NormalModuleReplacementPlugin(
      /symbol-crypto-wasm-node/,
      '../../../symbol-crypto-wasm-web/symbol_crypto_wasm.js'
    ));

    // fs モジュールのエラーを解決するための設定
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
    };

    // WebAssemblyの実験的機能を有効化
    config.experiments = {
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true
    };

    return config;
  }
}

export default nextConfig;
