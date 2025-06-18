/**
 * Playwright グローバル終了処理
 * E2Eテスト終了後のクリーンアップ処理
 */
import type { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
	try {
		// テストデータのクリーンアップ（必要に応じて）
		// await cleanupTestData();

		console.log("✓ Global teardown completed");
	} catch (error) {
		console.error("Global teardown failed:", error);
		// teardownの失敗はテスト結果に影響しないように警告のみ
	}
}

export default globalTeardown;
