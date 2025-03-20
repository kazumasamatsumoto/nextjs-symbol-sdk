問題の原因は複数あるようです：

1. **bitcore-lib の重複インスタンス**：
   エラーメッセージ「More than one instance of bitcore-lib found」が示すように、symbol-sdk が内部で使用している bitcore-lib が重複してロードされています。これは依存関係の解決問題です。

2. **WebAssembly の互換性問題**：
   「The generated code contains 'async/await' because this module is using "asyncWebAssembly". However, your target environment does not appear to support 'async/await'」というエラーは、symbol-crypto-wasm-web モジュールが WebAssembly を使用していますが、ブラウザ環境で正しく動作していないことを示しています。

3. **サーバーサイドレンダリング（SSR）の問題**：
   Symbol SDK は主にクライアントサイドを想定していますが、Next.js の SSR で実行されようとしていることが問題を引き起こしています。

解決策としては：

1. クライアントコンポーネントとして明示的に指定
2. ページコンポーネントをさらに分割し、Symbol SDK の機能をクライアントサイドのみで使用
3. bitcore-lib の依存関係の問題を解決するために、npm dedupe コマンドの実行

Symbol SDK はブラウザでの動作が完全に最適化されているわけではなく、特に Next.js のようなハイブリッドレンダリングフレームワークでは課題があります。

もし本格的に Symbol SDK を使用したアプリケーションを開発する場合は、クライアントサイドのみのフレームワーク（Create React App など）を使用するか、バックエンドで SDK を使用して API を構築し、フロントエンドはその API を呼び出す構成が推奨されます。

この問題を解決するためにインストールしたのは以下のパッケージです：

1. **crypto-browserify** - Node.js の crypto モジュールのブラウザポリフィル
2. **stream-browserify** - Node.js の stream モジュールのブラウザポリフィル

これらのパッケージは Symbol SDK が Node.js 環境の機能に依存しているためにインストールが必要でした。Symbol SDK は主に Node.js 環境での使用を想定して設計されていますが、ブラウザで使用するにはこれらのポリフィルが必要です。

また、webpack の設定で以下の対応も行いました：

- WebAssembly のサポート設定（asyncWebAssembly, topLevelAwait）
- ファイルシステム関連モジュール（fs, path）の fallback 設定
- symbol-crypto-wasm-node から symbol-crypto-wasm-web への置き換え

Next.js のプロジェクト設定では、Turbopack から Webpack に切り替えることで、より細かく依存関係と互換性の問題を解決できるようにしました。

これらの対応により、Symbol SDK をブラウザ環境（Next.js）で動作させることができるようになりました。

## Vercel 環境での WASM ファイル処理

Vercel でデプロイ時に以下のエラーが発生しました：

```
Error occurred prerendering page "/". Read more: https://nextjs.org/docs/messages/prerender-error
Error: ENOENT: no such file or directory, open '/vercel/path0/.next/server/static/wasm/5569177e2aa5bf2a.wasm'
```

このエラーは、Vercel 環境でのビルド時に WebAssembly（WASM）ファイルが正しく処理されていないことを示しています。以下の修正を行いました：

### 1. 正しい WASM ファイルパスの指定

symbol-crypto-wasm-web パッケージ内の WASM ファイルの正確な名前は`symbol_crypto_wasm_bg.wasm`であることを確認し、パスを修正しました。

### 2. Next.js の設定の最適化

- `turbo`設定を削除し、webpack 設定に集中
- `serverExternalPackages`を使用して WASM パッケージを適切に扱う設定を追加
- `output: 'standalone'`を指定して、ビルド出力に WASM ファイルを含めるように設定

### 3. Webpack の CopyPlugin 設定

```javascript
const CopyPlugin = require("copy-webpack-plugin");
config.plugins.push(
  new CopyPlugin({
    patterns: [
      {
        from: wasmPath,
        to: path.join(
          process.cwd(),
          ".next/server/static/wasm/5569177e2aa5bf2a.wasm"
        ),
        noErrorOnMissing: true,
      },
      {
        from: wasmPath,
        to: path.join(process.cwd(), ".next/static/wasm/5569177e2aa5bf2a.wasm"),
        noErrorOnMissing: true,
      },
    ],
  })
);
```

### 4. クライアント側のコード強化

- WASM モジュールの初期化処理を追加
- エラーハンドリングとフォールバック処理を実装
- クライアントコンポーネントとして明示的に指定（"use client"）

### 5. TypeScript 設定の改善

WASM モジュールの型定義を追加：

```typescript
// symbol-crypto-wasm-webモジュールの型定義
declare module "symbol-crypto-wasm-web" {
  const symbolCryptoWasm: any;
  export default symbolCryptoWasm;
}

// WebAssemblyバイナリファイルをインポートするための型定義
declare module "*.wasm" {
  const content: any;
  export default content;
}
```

これらの対応により、Vercel 環境でも Symbol SDK の WASM ファイルが正しく処理されるようになり、デプロイ時のビルドエラーが解消されました。

# nextjs-symbol-sdk
