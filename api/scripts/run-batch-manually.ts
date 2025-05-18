/**
 * 開発環境でRSSバッチ処理を手動実行するスクリプト
 * 使い方: npm run dev:batch
 */
import type { D1Database } from "@cloudflare/workers-types";
import rssBatch from "../src/workers/rssBatch";

// 開発環境用のモック
const mockEnv = {
	DB: process.env.DB as unknown as D1Database,
};

const mockController = {
	noRetry: () => {},
	waitUntil: () => {},
} as any;

const mockContext = {
	waitUntil: () => {},
} as any;

// バッチ処理を実行
console.log("RSSバッチ処理を開始します...");
rssBatch
	.scheduled(mockController, mockEnv, mockContext)
	.then(() => {
		console.log("RSSバッチ処理が完了しました");
	})
	.catch((error) => {
		console.error("エラーが発生しました:", error);
	});