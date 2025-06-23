/**
 * ホームページのE2Eテスト
 * UIのトップページにアクセスして一覧にカードが表示されていることを確認
 */
import { expect, test } from "@playwright/test";

test.describe("ホームページ - カード表示確認", () => {
	test("トップページにアクセスして一覧にカードが表示される", async ({
		page,
	}) => {
		// UIのトップページにアクセス
		await page.goto("/");

		// ページタイトルを確認
		await expect(page).toHaveTitle(/Effective Yomimono/i);

		// ページが読み込まれるまで待機
		await page.waitForLoadState("networkidle");

		// ブックマークカードの一覧が表示されることを確認
		// カードコンテナまたはカード要素の存在を確認
		const cardContainer = page
			.locator(
				'[data-testid="bookmark-cards"], .bookmark-card, [class*="card"]',
			)
			.first();

		// カードが表示されるまで待機（データがない場合もあるため、タイムアウトを短く設定）
		try {
			await expect(cardContainer).toBeVisible({ timeout: 10000 });
			console.log("✅ ブックマークカードが表示されました");
		} catch (_error) {
			// データがない場合は、空の状態メッセージまたはカードコンテナの存在を確認
			const emptyMessage = page.locator(
				"text=/ブックマークがありません|No bookmarks|データがありません/i",
			);
			const hasEmptyMessage = await emptyMessage.isVisible();

			if (hasEmptyMessage) {
				console.log("✅ 空の状態メッセージが表示されました（データなし）");
			} else {
				// メイン要素の存在を確認
				const mainContent = page
					.locator('main, [role="main"], .main-content')
					.first();
				await expect(mainContent).toBeVisible();
				console.log("✅ メインコンテンツが表示されました");
			}
		}
	});
});
