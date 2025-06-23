/**
 * E2Eテスト用のヘルパー関数
 * 共通的なテスト操作を提供
 */
import { expect, type Page } from "@playwright/test";

/**
 * APIエンドポイントのベースURL
 */
export const API_BASE_URL = "http://localhost:8787";

/**
 * フロントエンドのベースURL
 */
export const FRONTEND_BASE_URL = "http://localhost:3000";

/**
 * APIへのリクエストを待つためのヘルパー
 */
export class ApiHelper {
	constructor(private page: Page) {}

	/**
	 * 指定されたAPIエンドポイントへのリクエストを待機
	 */
	async waitForApiCall(endpoint: string, method = "GET") {
		return this.page.waitForResponse(
			(response) =>
				response.url().includes(`${API_BASE_URL}${endpoint}`) &&
				response.request().method() === method,
		);
	}

	/**
	 * APIレスポンスのステータスとデータを検証
	 */
	async verifyApiResponse(endpoint: string, expectedStatus = 200) {
		const response = await this.waitForApiCall(endpoint);
		expect(response.status()).toBe(expectedStatus);
		return response.json();
	}
}

/**
 * ページナビゲーション用のヘルパー
 */
export class NavigationHelper {
	constructor(private page: Page) {}

	/**
	 * ホームページに移動
	 */
	async goToHome() {
		await this.page.goto("/");
		await this.page.waitForLoadState("networkidle");
	}

	/**
	 * お気に入りページに移動
	 */
	async goToFavorites() {
		await this.page.goto("/favorites");
		await this.page.waitForLoadState("networkidle");
	}

	/**
	 * ラベルページに移動
	 */
	async goToLabels() {
		await this.page.goto("/labels");
		await this.page.waitForLoadState("networkidle");
	}

	/**
	 * 最近の記事ページに移動
	 */
	async goToRecent() {
		await this.page.goto("/recent");
		await this.page.waitForLoadState("networkidle");
	}
}

/**
 * ブックマーク操作用のヘルパー
 */
export class BookmarkHelper {
	constructor(private page: Page) {}

	/**
	 * 新しいブックマークを作成
	 */
	async createBookmark(title: string, url: string) {
		await this.page.click('[data-testid="create-bookmark-button"]');
		await this.page.fill('[data-testid="bookmark-title-input"]', title);
		await this.page.fill('[data-testid="bookmark-url-input"]', url);
		await this.page.click('[data-testid="submit-bookmark-button"]');
	}

	/**
	 * ブックマークを既読にマーク
	 */
	async markAsRead(bookmarkId: string) {
		await this.page.click(
			`[data-testid="bookmark-${bookmarkId}"] [data-testid="mark-read-button"]`,
		);
	}

	/**
	 * ブックマークをお気に入りに追加
	 */
	async toggleFavorite(bookmarkId: string) {
		await this.page.click(
			`[data-testid="bookmark-${bookmarkId}"] [data-testid="favorite-button"]`,
		);
	}
}

/**
 * 共通の待機処理
 */
export class WaitHelper {
	constructor(private page: Page) {}

	/**
	 * 要素が表示されるまで待機
	 */
	async waitForElement(selector: string, timeout = 5000) {
		await this.page.waitForSelector(selector, { state: "visible", timeout });
	}

	/**
	 * テキストが表示されるまで待機
	 */
	async waitForText(text: string, timeout = 5000) {
		await this.page.waitForFunction(
			(searchText) => document.body.textContent?.includes(searchText),
			text,
			{ timeout },
		);
	}

	/**
	 * ローディングが完了するまで待機
	 */
	async waitForNoLoading() {
		await this.page.waitForLoadState("networkidle");

		// ローディングスピナーが存在する場合は非表示になるまで待機
		try {
			await this.page.waitForSelector('[data-testid="loading"]', {
				state: "hidden",
				timeout: 5000,
			});
		} catch {
			// ローディング要素が存在しない場合は無視
		}

		// スケルトンローディングが非表示になるまで待機
		try {
			await this.page.waitForSelector(".animate-pulse", {
				state: "hidden",
				timeout: 10000,
			});
		} catch {
			// スケルトンローディングが存在しない場合は無視
		}
	}

	/**
	 * APIレスポンスの待機
	 */
	async waitForApiResponse(endpoint: string, timeout = 10000) {
		return this.page.waitForResponse(
			(response) =>
				response.url().includes(endpoint) && response.status() === 200,
			{ timeout },
		);
	}

	/**
	 * ブックマークリストの読み込み完了を待機
	 */
	async waitForBookmarksList() {
		// APIからのブックマーク取得を待機
		try {
			await this.waitForApiResponse("/api/bookmarks");
		} catch {
			// API呼び出しが検出されない場合は無視
		}

		// スケルトンローディングの完了を待機
		await this.waitForNoLoading();

		// ブックマークリストまたは「表示するブックマークはありません」メッセージのいずれかが表示されるまで待機
		await this.page.waitForFunction(
			() => {
				const bookmarkItems = document.querySelectorAll(
					'[data-testid="bookmark-item"]',
				);
				const emptyMessage = document.querySelector(
					"text=表示するブックマークはありません。",
				);
				return bookmarkItems.length > 0 || emptyMessage !== null;
			},
			{ timeout: 15000 },
		);
	}
}
