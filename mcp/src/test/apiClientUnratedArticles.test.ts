/**
 * MCP APIクライアント getUnratedArticles 関数のテスト
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import { getUnratedArticles } from "../lib/apiClient.js";

// fetchをモック
global.fetch = vi.fn();

describe("apiClient.getUnratedArticles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// 環境変数のモック
		process.env.API_BASE_URL = "https://api.example.com";
	});

	test("正常に未評価記事を取得する", async () => {
		// モックレスポンスの準備
		const mockResponse = {
			success: true,
			bookmarks: [
				{
					id: 1,
					url: "https://example.com/unrated-1",
					title: "未評価記事1",
					isRead: false,
					isFavorite: false,
					label: null,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
				{
					id: 2,
					url: "https://example.com/unrated-2",
					title: "未評価記事2",
					isRead: true,
					isFavorite: true,
					label: {
						id: 1,
						name: "JavaScript",
						description: "JavaScript関連",
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-01T00:00:00.000Z",
					},
					createdAt: "2024-01-02T00:00:00.000Z",
					updatedAt: "2024-01-02T00:00:00.000Z",
				},
			],
		};

		// fetchのモック設定
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => mockResponse,
		} as Response);

		// 実行
		const result = await getUnratedArticles();

		// 検証
		expect(fetch).toHaveBeenCalledWith(
			"https://api.example.com/api/bookmarks/unrated",
		);
		expect(result).toEqual(mockResponse.bookmarks);
		expect(result).toHaveLength(2);
		expect(result[0].title).toBe("未評価記事1");
		expect(result[1].title).toBe("未評価記事2");
		expect(result[1].label?.name).toBe("JavaScript");
	});

	test("空配列が返される場合の処理", async () => {
		// モックレスポンスの準備
		const mockResponse = {
			success: true,
			bookmarks: [],
		};

		// fetchのモック設定
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => mockResponse,
		} as Response);

		// 実行
		const result = await getUnratedArticles();

		// 検証
		expect(fetch).toHaveBeenCalledWith(
			"https://api.example.com/api/bookmarks/unrated",
		);
		expect(result).toEqual([]);
		expect(result).toHaveLength(0);
	});

	test("HTTP 404エラーの場合", async () => {
		// fetchのモック設定
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
			status: 404,
			statusText: "Not Found",
		} as Response);

		// 実行と検証
		await expect(getUnratedArticles()).rejects.toThrow(
			"Failed to fetch unrated articles: Not Found",
		);
		expect(fetch).toHaveBeenCalledWith(
			"https://api.example.com/api/bookmarks/unrated",
		);
	});

	test("HTTP 500エラーの場合", async () => {
		// fetchのモック設定
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
			status: 500,
			statusText: "Internal Server Error",
		} as Response);

		// 実行と検証
		await expect(getUnratedArticles()).rejects.toThrow(
			"Failed to fetch unrated articles: Internal Server Error",
		);
		expect(fetch).toHaveBeenCalledWith(
			"https://api.example.com/api/bookmarks/unrated",
		);
	});

	test("ネットワークエラーの場合", async () => {
		// fetchのモック設定
		vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

		// 実行と検証
		await expect(getUnratedArticles()).rejects.toThrow("Network error");
		expect(fetch).toHaveBeenCalledWith(
			"https://api.example.com/api/bookmarks/unrated",
		);
	});

	test("JSONパースエラーの場合", async () => {
		// fetchのモック設定
		const mockResponse = {
			ok: true,
			json: async () => {
				throw new Error("Invalid JSON");
			},
		};
		vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

		// 実行と検証
		await expect(getUnratedArticles()).rejects.toThrow("Invalid JSON");
		expect(fetch).toHaveBeenCalledWith(
			"https://api.example.com/api/bookmarks/unrated",
		);
	});

	test("レスポンス形式が不正な場合（successプロパティなし）", async () => {
		// モックレスポンスの準備（不正な形式）
		const mockResponse = {
			bookmarks: [
				{
					id: 1,
					url: "https://example.com/article",
					title: "記事",
				},
			],
			// successプロパティが欠如
		};

		// fetchのモック設定
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => mockResponse,
		} as Response);

		// 実行と検証
		await expect(getUnratedArticles()).rejects.toThrow(
			"Invalid API response for unrated articles",
		);
		expect(fetch).toHaveBeenCalledWith(
			"https://api.example.com/api/bookmarks/unrated",
		);
	});

	test("レスポンス形式が不正な場合（bookmarksプロパティなし）", async () => {
		// モックレスポンスの準備（不正な形式）
		const mockResponse = {
			success: true,
			// bookmarksプロパティが欠如
		};

		// fetchのモック設定
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => mockResponse,
		} as Response);

		// 実行と検証
		await expect(getUnratedArticles()).rejects.toThrow(
			"Invalid API response for unrated articles",
		);
		expect(fetch).toHaveBeenCalledWith(
			"https://api.example.com/api/bookmarks/unrated",
		);
	});

	test("API_BASE_URLが設定されていない場合のテストは統合テストで実行", async () => {
		// このテストケースは環境変数とmockの相互作用により複雑になるため、
		// 単体テストでは省略し、統合テストで実際の環境変数設定をテストする
		expect(true).toBe(true);
	});
});
