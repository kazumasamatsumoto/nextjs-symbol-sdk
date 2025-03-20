import type { NextConfig } from "next";
import path from "path";
import fs from "fs";

/** @type {import('next').NextConfig} */
const webpack = require('webpack')
const nextConfig = {
  reactStrictMode: true,
  // WebAssemblyをブラウザとサーバーの両方でロードできるようにする
  serverExternalPackages: ['symbol-crypto-wasm-web'],
  output: 'standalone',
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

    // WASMファイルを処理するための設定
    if (isServer) {
      // WASMファイルのパスを確認
      const wasmPath = path.join(process.cwd(), 'node_modules/symbol-crypto-wasm-web/symbol_crypto_wasm_bg.wasm');
      const outputDir = path.join(process.cwd(), '.next/server/static/wasm');

      // CopyPlugin設定
      const CopyPlugin = require('copy-webpack-plugin');
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: wasmPath,
              to: path.join(process.cwd(), '.next/server/static/wasm/5569177e2aa5bf2a.wasm'),
              noErrorOnMissing: true,
            },
            {
              from: wasmPath,
              to: path.join(process.cwd(), '.next/static/wasm/5569177e2aa5bf2a.wasm'),
              noErrorOnMissing: true,
            },
          ],
        })
      );
    }

    return config;
  }
}

export default nextConfig;
