"use client";

import { PrivateKey } from "symbol-sdk";
import { KeyPair, models, SymbolFacade } from "symbol-sdk/symbol";
import { useEffect, useState } from "react";

export default function Home() {
  const [messageText, setMessageText] = useState("Hello Symbol!");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // 定数の定義
  const NODE = "http://sym-test-01.opening-line.jp:3000";
  const facade = new SymbolFacade("testnet");
  const AlicePrivateKey =
    "33047CFD3ABA8E1B6FE047182F9B0118E2FA7E7D9E33865533AB582973F3B2A8";
  const AlicePublicKey =
    "ABC57E7B68FF6AA2E5F3D7E674D071697F00F1B377AE484C1EDBA3EEB29761B8";
  const BobAddress = "TCSMJNJTRI76YPGQFDEZBFL3XTM4L3AWELOGBDY";

  useEffect(() => {
    try {
      const privateKey = new PrivateKey(AlicePrivateKey);
      console.log(`Private Key: ${privateKey.toString()}`);
      const keyPair = new KeyPair(privateKey);
      console.log(`Public Key: ${keyPair.publicKey.toString()}`);
    } catch (error) {
      console.error("初期化エラー:", error);
    }
  }, []);

  const handleSendTransaction = async () => {
    try {
      setLoading(true);
      setResult("");

      // メッセージは8バイトの倍数にする必要があるため、パディングを追加
      const rawMessage = new TextEncoder().encode(messageText);
      const paddingSize = 8 - (rawMessage.length % 8);
      const paddedMessage = new Uint8Array(rawMessage.length + paddingSize + 1);
      paddedMessage[0] = 0x00; // プレーンテキストを示すフラグ
      paddedMessage.set(rawMessage, 1);

      // パディング部分にゼロを設定
      for (let i = rawMessage.length + 1; i < paddedMessage.length; i++) {
        paddedMessage[i] = 0;
      }

      const tx = facade.transactionFactory.create({
        type: "transfer_transaction_v1",
        signerPublicKey: AlicePublicKey,
        deadline: facade.network.fromDatetime(new Date()).addHours(2).timestamp,
        recipientAddress: BobAddress,
        mosaics: [
          { mosaicId: BigInt("0x72c0212e67a08bce"), amount: BigInt("1000000") },
        ],
        message: paddedMessage,
      });

      tx.fee = new models.Amount(BigInt(tx.size * 100));

      console.log("トランザクションの中身を確認します!", tx);

      const keyPair = new KeyPair(new PrivateKey(AlicePrivateKey));

      const sig = facade.signTransaction(keyPair, tx);
      const jsonPayload = facade.transactionFactory.static.attachSignature(
        tx,
        sig
      );

      console.log("JSON Payload:", jsonPayload);

      // アナウンス
      const res = await fetch(new URL("/transactions", NODE), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: jsonPayload,
      }).then((res) => res.json());

      console.log("結果発表", res);
      setResult(JSON.stringify(res, null, 2));
    } catch (error: any) {
      console.error("エラーが発生しました", error);
      setResult(`エラー: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24`}
    >
      <div className="flex flex-col items-center justify-center w-full max-w-md gap-4 p-6 bg-white rounded-lg shadow-md dark:bg-zinc-800">
        <h2 className="text-2xl font-bold">Symbol トランザクション送信</h2>

        <div className="w-full">
          <label htmlFor="message" className="block mb-2 text-sm font-medium">
            メッセージ:
          </label>
          <input
            type="text"
            id="message"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-zinc-700 dark:border-zinc-600"
          />
        </div>

        <button
          onClick={handleSendTransaction}
          disabled={loading}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
        >
          {loading ? "送信中..." : "トランザクションを送信"}
        </button>

        {result && (
          <div className="w-full p-4 mt-4 overflow-auto text-sm border rounded-md dark:border-zinc-600">
            <pre>{result}</pre>
          </div>
        )}
      </div>
    </main>
  );
}
