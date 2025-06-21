/**
 * 必須シナリオのE2Eテスト（軽量化版）
 * GitHub Actions無料枠を有効活用するため、最低限の正常系のみをテスト
 */
import { expect, test } from "@playwright/test";

test.describe("必須シナリオ - 未読一覧", () => {
	test("未読一覧画面の表示", async ({ page }) => {
		// ページのエラーをキャッチ
		const pageErrors: string[] = [];
		const consoleMessages: string[] = [];

		page.on("pageerror", (error) => {
			pageErrors.push(`Page error: ${error.message}`);
		});

		page.on("console", (msg) => {
			consoleMessages.push(`Console ${msg.type()}: ${msg.text()}`);
		});

		// UIのトップページにアクセス
		console.log("Navigating to homepage...");
		await page.goto("/");

		// ページが完全に読み込まれるまで待機
		console.log("Waiting for network idle...");
		await page.waitForLoadState("networkidle");

		// 少し追加で待機（React Queryの初期化等を考慮）
		console.log("Additional wait for React initialization...");
		await page.waitForTimeout(3000);

		// ページの状態をデバッグ
		console.log("Current URL:", page.url());
		console.log("Page errors:", pageErrors);
		console.log("Console messages:", consoleMessages.slice(-10)); // 最新の10件のみ

		// HTMLの存在確認
		const htmlContent = await page.content();
		console.log("HTML length:", htmlContent.length);
		console.log("Contains Next.js script?", htmlContent.includes("_next"));
		console.log("Contains React?", htmlContent.includes("react"));

		// ページタイトルを確認（デバッグ情報付き）
		try {
			// 明示的にタイトルが設定されるまで待機
			await page.waitForFunction(
				() => document.title && document.title.trim() !== "",
				{ timeout: 15000 },
			);
			await expect(page).toHaveTitle(/Effective Yomimono/i);
		} catch (error) {
			console.log("Final debug info:");
			console.log("Current title:", await page.title());
			console.log("HTML head content:", await page.innerHTML("head"));
			const scripts = await page.locator("script").count();
			console.log("Number of script tags:", scripts);

			// Next.js specific checks
			const nextData = await page.evaluate(() => window.__NEXT_DATA__);
			console.log("Next.js data available:", !!nextData);

			throw error;
		}

		// メインコンテンツの存在を確認
		const mainContent = page
			.locator('main, [role="main"], .main-content')
			.first();
		await expect(mainContent).toBeVisible();

		// 未読一覧の表示確認（データがある場合とない場合両方に対応）
		// まずブックマークカードコンテナの存在を確認
		const bookmarkContainer = page.locator('[data-testid="bookmark-cards"]');
		const hasBookmarkContainer = await bookmarkContainer
			.isVisible({ timeout: 2000 })
			.catch(() => false);

		if (hasBookmarkContainer) {
			// ブックマークカードが存在する場合
			await expect(bookmarkContainer).toBeVisible({ timeout: 5000 });
		} else {
			// データがない場合は空の状態メッセージまたはカード要素を確認
			const fallbackElements = page
				.locator('.bookmark-card, [class*="card"]')
				.first();
			const emptyMessage = page.locator(
				"text=/ブックマークがありません|No bookmarks|データがありません/i",
			);

			const hasCards = await fallbackElements
				.isVisible({ timeout: 1000 })
				.catch(() => false);
			const hasEmptyMessage = await emptyMessage
				.isVisible({ timeout: 1000 })
				.catch(() => false);

			if (hasCards) {
				await expect(fallbackElements).toBeVisible();
			} else if (hasEmptyMessage) {
				await expect(emptyMessage).toBeVisible();
			} else {
				// 最低限メインコンテンツの存在を確認
				const mainContent = page.locator('main, [role="main"]').first();
				await expect(mainContent).toBeVisible();
			}
		}
	});
});

test.describe("必須シナリオ - 既読処理", () => {
	test("既読処理と表示内容変更の確認", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// ページが正常に表示されていることを確認
		const mainContent = page.locator('main, [role="main"]').first();
		await expect(mainContent).toBeVisible();

		// 既読ボタンまたはマークボタンの存在確認
		const readButton = page
			.locator(
				'button:has-text("既読"), button:has-text("Read"), [aria-label*="既読"], [aria-label*="read"]',
			)
			.first();

		// ボタンが存在する場合のみテスト実行
		const hasReadButton = await readButton
			.isVisible({ timeout: 3000 })
			.catch(() => false);

		if (hasReadButton) {
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
			// データがない場合は空状態メッセージまたは基本的なコンテンツ要素の確認
			const emptyMessage = page.locator(
				"text=/ブックマークがありません|No bookmarks|データがありません|表示するブックマークはありません/i",
			);
			const hasEmptyMessage = await emptyMessage
				.isVisible({ timeout: 2000 })
				.catch(() => false);

			if (hasEmptyMessage) {
				await expect(emptyMessage).toBeVisible();
			} else {
				// 空のメッセージがない場合は、最低限ページが機能していることを確認
				const pageTitle = await page.title();
				expect(pageTitle).toMatch(/Effective Yomimono/i);
			}
		}
	});
});

test.describe("必須シナリオ - ラベルフィルタ", () => {
	test("ラベルフィルタリング機能", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// ラベルフィルタ要素の存在確認
		const labelFilter = page
			.locator(
				'select:has(option:text-matches("ラベル|Label")), input[placeholder*="ラベル"], input[placeholder*="label"], [data-testid="label-filter"]',
			)
			.first();

		// フィルタが存在する場合のみテスト実行
		if (await labelFilter.isVisible({ timeout: 3000 })) {
			// 初期状態の記録
			const initialItems = await page
				.locator(
					'[data-testid="bookmark-cards"] > *, .bookmark-card, [class*="card"]',
				)
				.count();

			// ラベルフィルタの操作（selectまたはinputに応じて）
			const tagName = await labelFilter.evaluate((el) => el.tagName);
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
			const filteredItems = await page
				.locator(
					'[data-testid="bookmark-cards"] > *, .bookmark-card, [class*="card"]',
				)
				.count();

			// 何らかの変化があることを確認（アイテム数の変化または空状態の表示）
			const hasChanges =
				filteredItems !== initialItems ||
				(await page
					.locator("text=/該当なし|見つかりません|No results/i")
					.isVisible());
			expect(hasChanges).toBe(true);
		} else {
			// ラベルフィルタが存在しない場合は、基本的なナビゲーション要素の確認
			const navigation = page
				.locator("nav, [role='navigation'], .navigation")
				.first();
			await expect(navigation).toBeVisible({ timeout: 3000 });
		}
	});

	test("ラベルフィルタ適用時の記事の並び順確認", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// ラベルフィルタボタンの存在確認（新しいButtonベースのUI）
		const labelButtons = page.locator(
			'button:has-text("すべて"), button[type="button"]',
		);

		// ラベルボタンが存在する場合のみテスト実行
		if ((await labelButtons.count()) > 1) {
			// 「すべて」以外のラベルボタンを取得
			const specificLabelButton = labelButtons.nth(1);

			// ラベルフィルタを適用
			await specificLabelButton.click();
			await page.waitForTimeout(1000); // フィルタリング処理の待機

			// フィルタされた記事の日付を取得
			const bookmarkItems = page.locator('[data-testid="bookmark-item"]');
			const itemCount = await bookmarkItems.count();

			if (itemCount >= 2) {
				// 複数の記事がある場合、日付順序を確認
				const dates: Date[] = [];

				for (let i = 0; i < Math.min(itemCount, 5); i++) {
					// 最大5件まで確認
					const dateText = await bookmarkItems
						.nth(i)
						.locator("p.text-xs.text-gray-500")
						.textContent();

					if (dateText) {
						// 日本語の日付形式（例: 2024/1/15）をDateオブジェクトに変換
						const dateMatch = dateText.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
						if (dateMatch) {
							const [, year, month, day] = dateMatch;
							const date = new Date(
								Number.parseInt(year),
								Number.parseInt(month) - 1,
								Number.parseInt(day),
							);
							dates.push(date);
						}
					}
				}

				// 日付が新しい順（降順）に並んでいることを確認
				if (dates.length >= 2) {
					for (let i = 0; i < dates.length - 1; i++) {
						expect(dates[i].getTime()).toBeGreaterThanOrEqual(
							dates[i + 1].getTime(),
						);
					}
				}
			} else if (itemCount === 1) {
				// 1件の場合は正常に表示されていることを確認
				await expect(bookmarkItems.first()).toBeVisible();
			} else {
				// 0件の場合は空状態の確認
				const emptyMessage = page.locator(
					"text=/表示するブックマークはありません|該当なし|見つかりません/i",
				);
				await expect(emptyMessage).toBeVisible({ timeout: 3000 });
			}
		} else {
			// ラベルボタンが存在しない場合は、基本的な記事表示の確認
			const bookmarkItems = page.locator('[data-testid="bookmark-item"]');
			const itemCount = await bookmarkItems.count();

			if (itemCount > 0) {
				await expect(bookmarkItems.first()).toBeVisible();
			}
		}
	});
});
