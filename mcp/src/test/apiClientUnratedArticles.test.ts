/**
 * APIクライアントの未評価記事取得機能のテスト
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../lib/apiClient.js";

// fetchのモック
global.fetch = vi.fn();

// 環境変数を保存
const originalEnv = process.env;

describe("apiClient - getUnratedArticles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// テスト用の環境変数をセット
		process.env = { ...originalEnv, API_BASE_URL: "https://api.example.com" };
	});

	afterEach(() => {
		vi.restoreAllMocks();
		// 環境変数を元に戻す
		process.env = originalEnv;
	});

	it("未評価記事を正常に取得する", async () => {
		// モックレスポンス
		const mockResponse = {
			success: true,
			bookmarks: [
				{
					id: 1,
					url: "https://example.com/article1",
					title: "未評価の記事1",
					isRead: false,
					isFavorite: false,
					label: null,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
				{
					id: 2,
					url: "https://example.com/article2",
					title: "未評価の記事2",
					isRead: true,
					isFavorite: true,
					label: {
						id: 1,
						name: "JavaScript",
						description: "JavaScript関連の記事",
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-01T00:00:00.000Z",
					},
					createdAt: "2024-01-02T00:00:00.000Z",
					updatedAt: "2024-01-02T00:00:00.000Z",
				},
			],
		};

		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => mockResponse,
		} as Response);

		// APIを呼び出し
		const result = await apiClient.getUnratedArticles();

		// 検証
		expect(fetch).toHaveBeenCalledWith(
			"https://api.example.com/api/bookmarks/unrated",
		);
		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject({
			id: 1,
			title: "未評価の記事1",
		});
		expect(result[1]).toMatchObject({
			id: 2,
			title: "未評価の記事2",
			label: {
				name: "JavaScript",
			},
		});
	});

	it("空の配列を返す場合も正常に処理する", async () => {
		// モックレスポンス
		const mockResponse = {
			success: true,
			bookmarks: [],
		};

		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => mockResponse,
		} as Response);

		// APIを呼び出し
		const result = await apiClient.getUnratedArticles();

		// 検証
		expect(result).toEqual([]);
	});

	it("APIがエラーレスポンスを返す場合、エラーをスローする", async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
			statusText: "Internal Server Error",
		} as Response);

		// 検証
		await expect(apiClient.getUnratedArticles()).rejects.toThrow(
			"Failed to fetch unrated articles: Internal Server Error",
		);
	});

	it("レスポンスが無効なスキーマの場合、エラーをスローする", async () => {
		// 無効なレスポンス（bookmarksキーが存在しない）
		const mockResponse = {
			success: true,
			articles: [], // 'bookmarks'ではなく'articles'
		};

		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => mockResponse,
		} as Response);

		// 検証
		await expect(apiClient.getUnratedArticles()).rejects.toThrow(
			"Invalid API response for unrated articles",
		);
	});

	it("API_BASE_URLが設定されていない場合、エラーをスローする", async () => {
		// 環境変数を削除
		process.env = { ...originalEnv };
		delete process.env.API_BASE_URL;

		// getApiBaseUrl関数を再度呼び出すために、モジュールをリロード
		vi.resetModules();
		const { getUnratedArticles } = await import("../lib/apiClient.js");

		// 検証
		await expect(getUnratedArticles()).rejects.toThrow(
			"API_BASE_URL environment variable is not set.",
		);
	});
});
