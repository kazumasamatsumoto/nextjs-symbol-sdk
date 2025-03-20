// symbol-crypto-wasm-webモジュールの型定義
declare module 'symbol-crypto-wasm-web' {
    // モジュールがエクスポートするすべての関数や変数の型を定義
    // ここでは具体的な型情報はないため空のオブジェクトとして定義
    const symbolCryptoWasm: any;
    export default symbolCryptoWasm;
}

// WebAssemblyバイナリファイルをインポートするための型定義
declare module '*.wasm' {
    const content: any;
    export default content;
} 