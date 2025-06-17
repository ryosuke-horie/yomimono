/**
 * ホームページのE2Eテスト
 * 基本的なページ表示とナビゲーションをテスト
 */
import { expect, test } from "@playwright/test";
import { NavigationHelper, WaitHelper } from "../utils/test-helpers";

test.describe("ホームページ", () => {
	test("ページが正しく表示される", async ({ page }) => {
		const navigation = new NavigationHelper(page);
		const wait = new WaitHelper(page);

		// ホームページに移動
		await navigation.goToHome();

		// ページタイトルを確認
		await expect(page).toHaveTitle(/effective-yomimono/i);

		// ヘッダーが表示されることを確認
		await wait.waitForElement('[data-testid="header"]');
		await expect(page.locator('[data-testid="header"]')).toBeVisible();

		// メインコンテンツが表示されることを確認
		await expect(page.locator("main")).toBeVisible();
	});

	test("ナビゲーションが正しく動作する", async ({ page }) => {
		const navigation = new NavigationHelper(page);

		// ホームページから開始
		await navigation.goToHome();

		// お気に入りページへのナビゲーション
		await page.click('a[href="/favorites"]');
		await expect(page).toHaveURL("/favorites");

		// ラベルページへのナビゲーション
		await page.click('a[href="/labels"]');
		await expect(page).toHaveURL("/labels");

		// 最近の記事ページへのナビゲーション
		await page.click('a[href="/recent"]');
		await expect(page).toHaveURL("/recent");

		// ホームページに戻る
		await page.click('a[href="/"]');
		await expect(page).toHaveURL("/");
	});

	test("ブックマークカードが正しく表示される", async ({ page }) => {
		const navigation = new NavigationHelper(page);
		const wait = new WaitHelper(page);

		// ホームページに移動
		await navigation.goToHome();

		// ブックマークリストの読み込み完了を待機
		await wait.waitForBookmarksList();

		// メインコンテンツエリアが表示されることを確認
		await expect(page.locator("main")).toBeVisible();

		// ブックマークリストのコンテナが表示されることを確認
		const bookmarksList = page.locator('[data-testid="bookmark-item"]');

		// ブックマークが存在する場合のテスト
		const bookmarkCount = await bookmarksList.count();

		if (bookmarkCount > 0) {
			// 最初のブックマークカードが表示されることを確認
			const firstBookmark = bookmarksList.first();
			await expect(firstBookmark).toBeVisible();

			// ブックマークカード内の必須要素を確認
			await expect(firstBookmark.locator("article")).toBeVisible();
			await expect(firstBookmark.locator("h2")).toBeVisible(); // タイトル
			await expect(firstBookmark.locator("a")).toBeVisible(); // リンク

			// ブックマークカードの構造を詳細に検証
			const article = firstBookmark.locator("article");

			// タイトルリンクの検証
			const titleLink = article.locator("h2 a");
			await expect(titleLink).toBeVisible();
			const linkText = await titleLink.textContent();
			expect(linkText).toBeTruthy();
			expect(linkText).not.toBe("タイトルなし");

			// URL表示の検証
			const urlParagraph = article.locator("p").first();
			await expect(urlParagraph).toBeVisible();
			const urlText = await urlParagraph.textContent();
			expect(urlText).toMatch(/^https?:\/\//);

			// 日付表示の検証
			const dateParagraph = article.locator("p").last();
			await expect(dateParagraph).toBeVisible();
			const dateText = await dateParagraph.textContent();
			expect(dateText).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/); // 日付形式をチェック

			// 機能ボタンの検証（URLコピー、IDコピー、お気に入り、シェア、既読/未読）
			const buttons = article.locator("button");
			await expect(buttons).toHaveCount(5);

			console.log(
				`✓ ${bookmarkCount}件のブックマークカードが正しく表示されています`,
			);
		} else {
			// ブックマークが存在しない場合のメッセージを確認
			await expect(
				page.locator("text=表示するブックマークはありません。"),
			).toBeVisible();
			console.log(
				"✓ ブックマークがない状態のメッセージが正しく表示されています",
			);
		}

		// 統計情報（未読数・既読数）が表示されることを確認
		const statsContainer = page.locator("text=未読:");
		if (await statsContainer.isVisible()) {
			await expect(page.locator("text=本日既読:")).toBeVisible();
			console.log("✓ 統計情報が正しく表示されています");
		}

		// 記事追加ボタンが表示されることを確認
		await expect(page.locator("button:has-text('記事を追加')")).toBeVisible();
	});

	test("ブックマークカードの基本操作が正しく動作する", async ({ page }) => {
		const navigation = new NavigationHelper(page);
		const wait = new WaitHelper(page);

		// ホームページに移動
		await navigation.goToHome();

		// ブックマークリストの読み込み完了を待機
		await wait.waitForBookmarksList();

		// ブックマークが存在する場合のみテストを実行
		const bookmarksList = page.locator('[data-testid="bookmark-item"]');
		const bookmarkCount = await bookmarksList.count();

		if (bookmarkCount > 0) {
			const firstBookmark = bookmarksList.first();
			const article = firstBookmark.locator("article");

			// ブックマークタイトルリンクのクリック動作を確認
			const titleLink = article.locator("h2 a");
			await expect(titleLink).toBeVisible();

			// リンクのhref属性が設定されていることを確認
			const href = await titleLink.getAttribute("href");
			expect(href).toBeTruthy();
			expect(href).toMatch(/^https?:\/\//);

			// target="_blank"属性が設定されていることを確認
			const target = await titleLink.getAttribute("target");
			expect(target).toBe("_blank");

			// rel="noopener noreferrer"属性が設定されていることを確認
			const rel = await titleLink.getAttribute("rel");
			expect(rel).toBe("noopener noreferrer");

			// 各機能ボタンの存在と位置を確認
			const buttons = article.locator("button");
			await expect(buttons).toHaveCount(5);

			// URLコピーボタン（右から5番目）
			const urlCopyButton = buttons.nth(0);
			await expect(urlCopyButton).toBeVisible();
			await expect(urlCopyButton).toHaveAttribute("title", /URLをコピー/);

			// IDコピーボタン（右から4番目）
			const idCopyButton = buttons.nth(1);
			await expect(idCopyButton).toBeVisible();
			await expect(idCopyButton).toHaveAttribute("title", /ID:/);

			// お気に入りボタン（右から3番目）
			const favoriteButton = buttons.nth(2);
			await expect(favoriteButton).toBeVisible();
			await expect(favoriteButton).toHaveAttribute(
				"title",
				/(お気に入りに追加|お気に入りから削除)/,
			);

			// シェアボタン（右から2番目）
			const shareButton = buttons.nth(3);
			await expect(shareButton).toBeVisible();
			await expect(shareButton).toHaveAttribute("title", "Xでシェア");

			// 既読/未読ボタン（右端）
			const readButton = buttons.nth(4);
			await expect(readButton).toBeVisible();
			await expect(readButton).toHaveAttribute(
				"title",
				/(既読にする|未読に戻す)/,
			);

			// グリッドレイアウトが正しく適用されていることを確認
			const bookmarksContainer = bookmarksList.first().locator("..");
			const gridClasses = await bookmarksContainer.getAttribute("class");
			expect(gridClasses).toContain("grid");
			expect(gridClasses).toContain("gap-4");

			console.log("✓ ブックマークカードの基本操作要素が正しく表示されています");
		} else {
			console.log(
				"⚠ ブックマークが存在しないため、操作テストをスキップしました",
			);
		}
	});

	test("レスポンシブデザインが正しく動作する", async ({ page }) => {
		const navigation = new NavigationHelper(page);

		// ホームページに移動
		await navigation.goToHome();

		// デスクトップサイズでの表示確認
		await page.setViewportSize({ width: 1280, height: 720 });
		await expect(page.locator('[data-testid="header"]')).toBeVisible();

		// タブレットサイズでの表示確認
		await page.setViewportSize({ width: 768, height: 1024 });
		await expect(page.locator('[data-testid="header"]')).toBeVisible();

		// モバイルサイズでの表示確認
		await page.setViewportSize({ width: 375, height: 667 });
		await expect(page.locator('[data-testid="header"]')).toBeVisible();
	});
});

if (import.meta.vitest) {
	const { test: vitestTest, expect: vitestExpect } = import.meta.vitest;

	vitestTest("E2Eテストの設定が正しく動作する", () => {
		// この関数はPlaywrightテストの設定を検証するためのユニットテスト
		vitestExpect(NavigationHelper).toBeDefined();
		vitestExpect(WaitHelper).toBeDefined();
	});
}
