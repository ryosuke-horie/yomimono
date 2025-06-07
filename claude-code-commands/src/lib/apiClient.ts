/**
 * API クライアント
 * yomimono API との通信を担当
 */
import type { ArticleInfo, RatingResult, SavedRating } from "../types/index.js";

/**
 * ブックマーク作成リクエスト
 */
export interface CreateBookmarkRequest {
	url: string;
	title: string;
}

/**
 * 評価作成リクエスト
 */
export interface CreateRatingRequest {
	articleId: number;
	practicalValue: number;
	technicalDepth: number;
	understanding: number;
	novelty: number;
	importance: number;
	comment?: string;
}

/**
 * API クライアントクラス
 */
export class ApiClient {
	private baseUrl: string;

	constructor(baseUrl?: string) {
		this.baseUrl = baseUrl || process.env.API_BASE_URL || "http://localhost:8787";
	}

	/**
	 * ブックマークを取得
	 */
	async getBookmark(id: number): Promise<ArticleInfo> {
		const response = await fetch(`${this.baseUrl}/bookmarks/${id}`);
		if (!response.ok) {
			throw new Error(`ブックマークの取得に失敗しました: ${response.statusText}`);
		}
		return await response.json();
	}

	/**
	 * ブックマークを作成
	 */
	async createBookmark(data: CreateBookmarkRequest): Promise<ArticleInfo> {
		const response = await fetch(`${this.baseUrl}/bookmarks`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`ブックマークの作成に失敗しました: ${response.statusText}`);
		}
		return await response.json();
	}

	/**
	 * URLで既存ブックマークをチェック
	 */
	async checkExistingBookmark(url: string): Promise<ArticleInfo | null> {
		const response = await fetch(`${this.baseUrl}/bookmarks?url=${encodeURIComponent(url)}`);
		if (response.status === 404) {
			return null;
		}
		if (!response.ok) {
			throw new Error(`既存ブックマークのチェックに失敗しました: ${response.statusText}`);
		}
		const bookmarks = await response.json();
		return bookmarks.length > 0 ? bookmarks[0] : null;
	}

	/**
	 * 評価を保存
	 */
	async saveRating(data: CreateRatingRequest): Promise<SavedRating> {
		const response = await fetch(`${this.baseUrl}/ratings`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`評価の保存に失敗しました: ${response.statusText}`);
		}
		return await response.json();
	}

	/**
	 * 既存評価をチェック
	 */
	async checkExistingRating(articleId: number): Promise<SavedRating | null> {
		const response = await fetch(`${this.baseUrl}/ratings?articleId=${articleId}`);
		if (response.status === 404) {
			return null;
		}
		if (!response.ok) {
			throw new Error(`既存評価のチェックに失敗しました: ${response.statusText}`);
		}
		const ratings = await response.json();
		return ratings.length > 0 ? ratings[0] : null;
	}

	/**
	 * 未評価記事一覧を取得
	 */
	async getUnratedBookmarks(): Promise<ArticleInfo[]> {
		const response = await fetch(`${this.baseUrl}/bookmarks/unrated`);
		if (!response.ok) {
			throw new Error(`未評価記事の取得に失敗しました: ${response.statusText}`);
		}
		return await response.json();
	}

	/**
	 * ヘルスチェック
	 */
	async healthCheck(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/health`);
			return response.ok;
		} catch {
			return false;
		}
	}
}

/**
 * デフォルトAPI クライアントインスタンス
 */
export const apiClient = new ApiClient();

if (import.meta.vitest) {
	const { test, expect, vi } = import.meta.vitest;

	// fetch のモック
	global.fetch = vi.fn();

	test("ApiClient が正しく初期化される", () => {
		const client = new ApiClient("https://api.example.com");
		expect(client).toBeInstanceOf(ApiClient);
	});

	test("getBookmark が正しく動作する", async () => {
		const mockResponse = {
			id: 1,
			title: "テスト記事",
			url: "https://example.com/article",
			createdAt: "2023-01-01T00:00:00Z",
		};

		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		const client = new ApiClient();
		const result = await client.getBookmark(1);

		expect(result).toEqual(mockResponse);
		expect(fetch).toHaveBeenCalledWith("http://localhost:8787/bookmarks/1");
	});

	test("createBookmark が正しく動作する", async () => {
		const requestData = {
			url: "https://example.com/article",
			title: "テスト記事",
		};

		const mockResponse = {
			id: 1,
			...requestData,
			createdAt: "2023-01-01T00:00:00Z",
		};

		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		const client = new ApiClient();
		const result = await client.createBookmark(requestData);

		expect(result).toEqual(mockResponse);
		expect(fetch).toHaveBeenCalledWith("http://localhost:8787/bookmarks", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestData),
		});
	});

	test("checkExistingBookmark が存在しない場合にnullを返す", async () => {
		(fetch as any).mockResolvedValueOnce({
			status: 404,
			ok: false,
		});

		const client = new ApiClient();
		const result = await client.checkExistingBookmark("https://example.com/article");

		expect(result).toBeNull();
	});

	test("saveRating が正しく動作する", async () => {
		const requestData = {
			articleId: 1,
			practicalValue: 8,
			technicalDepth: 7,
			understanding: 9,
			novelty: 6,
			importance: 8,
			comment: "とても参考になりました",
		};

		const mockResponse = {
			id: 1,
			...requestData,
			totalScore: 7.6,
			createdAt: "2023-01-01T00:00:00Z",
		};

		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		const client = new ApiClient();
		const result = await client.saveRating(requestData);

		expect(result).toEqual(mockResponse);
	});

	test("healthCheck が正しく動作する", async () => {
		(fetch as any).mockResolvedValueOnce({
			ok: true,
		});

		const client = new ApiClient();
		const result = await client.healthCheck();

		expect(result).toBe(true);
	});

	test("healthCheck がエラー時にfalseを返す", async () => {
		(fetch as any).mockRejectedValueOnce(new Error("Network error"));

		const client = new ApiClient();
		const result = await client.healthCheck();

		expect(result).toBe(false);
	});
}
