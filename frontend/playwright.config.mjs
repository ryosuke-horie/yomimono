/**
 * Playwright E2Eテスト設定
 * フロントエンドとAPIのローカル開発環境でのE2Eテストを設定
 */
import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * デフォルトのテスト設定を定義
 * 開発サーバー (フロントエンド: localhost:3000, API: localhost:8787)
 */
export default defineConfig({
	testDir: "./e2e",
	// テストファイルの拡張子
	testMatch: "**/*.spec.ts",
	// テストの並列実行数（CI環境では軽量化）
	fullyParallel: !process.env.CI,
	// CI環境では失敗時に再実行しない
	forbidOnly: !!process.env.CI,
	// ローカル開発では失敗時のリトライ回数（CI環境では軽量化）
	retries: process.env.CI ? 1 : 0,
	// 並列実行数の設定（CI環境では1つずつ実行して軽量化）
	workers: process.env.CI ? 1 : undefined,
	// CI環境でのタイムアウト設定（10分制限）
	timeout: process.env.CI ? 60000 : 30000, // CI: 1分, Local: 30秒
	// HTMLレポートの設定
	reporter: [
		["html", { outputFolder: "playwright-report" }],
		["list"],
		...(process.env.CI ? [["github", {}]] : []),
	],
	use: {
		// ベースURL（フロントエンド）
		baseURL: "http://localhost:3000",
		// トレース記録（CI環境では軽量化）
		trace: process.env.CI ? "off" : "on-first-retry",
		// スクリーンショット（CI環境では軽量化）
		screenshot: process.env.CI ? "only-on-failure" : "only-on-failure",
		// ビデオ録画（CI環境では無効化して軽量化）
		video: process.env.CI ? "off" : "retain-on-failure",
	},

	projects: process.env.CI ? [
		// CI環境：Chromeのみで軽量化
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	] : [
		// ローカル環境：全ブラウザでテスト
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},
		// モバイルテスト
		{
			name: "Mobile Chrome",
			use: { ...devices["Pixel 5"] },
		},
		{
			name: "Mobile Safari",
			use: { ...devices["iPhone 12"] },
		},
	],

	// 開発サーバーの起動設定
	// 注意: E2Eテスト実行前に `npm run servers:start` でサーバーを起動してください
	// webServer: [], // 手動起動前提のためコメントアウト

	// グローバル設定（手動サーバー起動前提のため無効化）
	// globalSetup: path.resolve("./e2e/global-setup.ts"),
	// globalTeardown: path.resolve("./e2e/global-teardown.ts"),
});