/**
 * Playwright グローバルセットアップ
 * E2Eテスト開始前の初期化処理
 */
import { chromium, type FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	try {
		// APIサーバーの健全性確認
		const apiResponse = await page.goto("http://localhost:8787/health");
		if (!apiResponse?.ok()) {
			throw new Error("API server is not responding");
		}
		console.log("✓ API server is ready");

		// フロントエンドサーバーの健全性確認
		const frontendResponse = await page.goto("http://localhost:3000");
		if (!frontendResponse?.ok()) {
			throw new Error("Frontend server is not responding");
		}
		console.log("✓ Frontend server is ready");

		// テストデータの初期化（必要に応じて）
		// await setupTestData();
	} catch (error) {
		console.error("Global setup failed:", error);
		throw error;
	} finally {
		await browser.close();
	}
}

export default globalSetup;
