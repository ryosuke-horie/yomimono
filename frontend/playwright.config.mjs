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
	// テストの並列実行数
	fullyParallel: true,
	// CI環境では失敗時に再実行しない
	forbidOnly: !!process.env.CI,
	// ローカル開発では失敗時のリトライ回数
	retries: process.env.CI ? 2 : 0,
	// 並列実行数の設定
	workers: process.env.CI ? 1 : undefined,
	// HTMLレポートの設定
	reporter: [
		["html", { outputFolder: "playwright-report" }],
		["list"],
		...(process.env.CI ? [["github", {}]] : []),
	],
	use: {
		// ベースURL（フロントエンド）
		baseURL: "http://localhost:3000",
		// トレース記録
		trace: "on-first-retry",
		// スクリーンショット
		screenshot: "only-on-failure",
		// ビデオ録画
		video: "retain-on-failure",
	},

	projects: [
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
	webServer: [
		{
			command: "npm run dev",
			url: "http://localhost:3000",
			reuseExistingServer: !process.env.CI,
			// フロントエンドの起動を待つ
			timeout: 120 * 1000,
		},
		{
			command: "cd ../api && npm run dev",
			url: "http://localhost:8787",
			reuseExistingServer: !process.env.CI,
			// APIの起動を待つ
			timeout: 120 * 1000,
		},
	],

	// グローバル設定
	globalSetup: path.resolve("./e2e/global-setup.ts"),
	globalTeardown: path.resolve("./e2e/global-teardown.ts"),
});