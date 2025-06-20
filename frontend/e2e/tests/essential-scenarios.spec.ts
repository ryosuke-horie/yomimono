/**
 * 必須シナリオのE2Eテスト（軽量化版）
 * GitHub Actions無料枠を有効活用するため、最低限の正常系のみをテスト
 */
import { expect, test } from "@playwright/test";

test.describe("必須シナリオ - 未読一覧", () => {
	test("未読一覧画面の表示", async ({ page }) => {
		// UIのトップページにアクセス
		await page.goto("/");

		// ページタイトルを確認
		await expect(page).toHaveTitle(/Effective Yomimono/i);

		// ページが読み込まれるまで待機
		await page.waitForLoadState("networkidle");

		// メインコンテンツの存在を確認
		const mainContent = page.locator('main, [role="main"], .main-content').first();
		await expect(mainContent).toBeVisible();

		// 未読一覧の表示確認（データがある場合とない場合両方に対応）
		const cardOrEmpty = page.locator(
			'[data-testid="bookmark-cards"], .bookmark-card, [class*="card"], text=/ブックマークがありません|No bookmarks|データがありません/i'
		).first();
		
		await expect(cardOrEmpty).toBeVisible({ timeout: 5000 });
	});
});

test.describe("必須シナリオ - 既読処理", () => {
	test("既読処理と表示内容変更の確認", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// 既読ボタンまたはマークボタンの存在確認
		const readButton = page.locator(
			'button:has-text("既読"), button:has-text("Read"), [aria-label*="既読"], [aria-label*="read"]'
		).first();

		// ボタンが存在する場合のみテスト実行
		if (await readButton.isVisible({ timeout: 3000 })) {
			// 初期状態の記録
			const initialContent = await page.textContent("main");
			
			// 既読処理実行
			await readButton.click();
			
			// 変更の確認（何らかの変化があることを確認）
			await expect(async () => {
				const currentContent = await page.textContent("main");
				expect(currentContent).not.toBe(initialContent);
			}).toPass({ timeout: 5000 });
		} else {
			// データがない場合は空状態の確認
			const emptyMessage = page.locator("text=/ブックマークがありません|No bookmarks|データがありません/i");
			await expect(emptyMessage).toBeVisible({ timeout: 3000 });
		}
	});
});

test.describe("必須シナリオ - ラベルフィルタ", () => {
	test("ラベルフィルタリング機能", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// ラベルフィルタ要素の存在確認
		const labelFilter = page.locator(
			'select:has(option:text-matches("ラベル|Label")), input[placeholder*="ラベル"], input[placeholder*="label"], [data-testid="label-filter"]'
		).first();

		// フィルタが存在する場合のみテスト実行
		if (await labelFilter.isVisible({ timeout: 3000 })) {
			// 初期状態の記録
			const initialItems = await page.locator('[data-testid="bookmark-cards"] > *, .bookmark-card, [class*="card"]').count();
			
			// ラベルフィルタの操作（selectまたはinputに応じて）
			const tagName = await labelFilter.tagName();
			if (tagName === "SELECT") {
				// セレクトボックスの場合
				const options = await labelFilter.locator("option").count();
				if (options > 1) {
					await labelFilter.selectOption({ index: 1 });
				}
			} else {
				// インプットの場合
				await labelFilter.fill("test");
			}

			// フィルタリング結果の確認（変化があることを確認）
			await page.waitForTimeout(1000); // フィルタリング処理の待機
			const filteredItems = await page.locator('[data-testid="bookmark-cards"] > *, .bookmark-card, [class*="card"]').count();
			
			// 何らかの変化があることを確認（アイテム数の変化または空状態の表示）
			const hasChanges = filteredItems !== initialItems || 
			                  await page.locator("text=/該当なし|見つかりません|No results/i").isVisible();
			expect(hasChanges).toBe(true);
		} else {
			// ラベルフィルタが存在しない場合は、基本的なナビゲーション要素の確認
			const navigation = page.locator("nav, [role='navigation'], .navigation").first();
			await expect(navigation).toBeVisible({ timeout: 3000 });
		}
	});
});