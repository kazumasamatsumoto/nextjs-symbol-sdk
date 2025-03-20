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
# nextjs-symbol-sdk
