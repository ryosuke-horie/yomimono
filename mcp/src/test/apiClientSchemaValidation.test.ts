/**
 * APIクライアントのスキーマバリデーションのテスト
 * Issue #617の修正に関連するテスト
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getReadBookmarks,
	getUnlabeledArticles,
	getUnreadBookmarks,
} from "../lib/apiClient";

// グローバルfetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// 環境変数のモック
process.env.API_BASE_URL = "http://localhost:8787";

describe("APIクライアント - スキーマバリデーション", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("getUnlabeledArticles", () => {
		it("labelプロパティを持たないレスポンスを正しく処理する", async () => {
			// APIレスポンスのモック（labelプロパティなし）
			const mockResponse = {
				success: true,
				bookmarks: [
					{
						id: 1,
						title: "Test Article 1",
						url: "https://example.com/1",
						isRead: false,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
					{
						id: 2,
						title: "Test Article 2",
						url: "https://example.com/2",
						isRead: false,
						createdAt: "2024-01-02T00:00:00Z",
						updatedAt: "2024-01-02T00:00:00Z",
					},
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await getUnlabeledArticles();

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				id: 1,
				title: "Test Article 1",
				url: "https://example.com/1",
				isRead: false,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
				label: null,
				isFavorite: false,
			});
			expect(result[1].label).toBeNull();
			expect(result[1].isFavorite).toBe(false);
		});

		it("不正なレスポンス形式でエラーをスローする", async () => {
			const mockResponse = {
				success: true,
				// bookmarksキーが欠けている
				articles: [],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			await expect(getUnlabeledArticles()).rejects.toThrow(
				"Invalid API response for unlabeled articles",
			);
		});
	});

	describe("getUnreadBookmarks", () => {
		it("label情報を持つレスポンスを正しく処理する", async () => {
			const mockResponse = {
				success: true,
				bookmarks: [
					{
						id: 1,
						title: "Test Article",
						url: "https://example.com/1",
						isRead: false,
						isFavorite: true,
						label: {
							id: 10,
							name: "Tech",
							description: "Technical articles",
							createdAt: "2024-01-01T00:00:00Z",
							updatedAt: "2024-01-01T00:00:00Z",
						},
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await getUnreadBookmarks();

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				id: 1,
				url: "https://example.com/1",
				title: "Test Article",
				labels: ["Tech"],
				isRead: false,
				isFavorite: true,
				createdAt: "2024-01-01T00:00:00Z",
				readAt: null,
				updatedAt: "2024-01-01T00:00:00Z",
			});
		});

		it("labelがnullのレスポンスを正しく処理する", async () => {
			const mockResponse = {
				success: true,
				bookmarks: [
					{
						id: 1,
						title: "Test Article",
						url: "https://example.com/1",
						isRead: false,
						label: null,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await getUnreadBookmarks();

			expect(result).toHaveLength(1);
			expect(result[0].labels).toEqual([]);
			expect(result[0].isFavorite).toBe(false);
		});

		it("isFavoriteがundefinedの場合にfalseとして処理する", async () => {
			const mockResponse = {
				success: true,
				bookmarks: [
					{
						id: 1,
						title: "Test Article",
						url: "https://example.com/1",
						isRead: false,
						// isFavoriteが存在しない
						label: null,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await getUnreadBookmarks();

			expect(result).toHaveLength(1);
			expect(result[0].isFavorite).toBe(false);
		});
	});

	describe("getReadBookmarks", () => {
		it("labelsとreadAtを持つレスポンスを正しく処理する", async () => {
			const mockResponse = {
				success: true,
				bookmarks: [
					{
						id: 1,
						url: "https://example.com/1",
						title: "Read Article",
						labels: ["Tech", "Backend"],
						isRead: true,
						isFavorite: true,
						createdAt: "2024-01-01T00:00:00Z",
						readAt: "2024-01-02T00:00:00Z",
					},
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await getReadBookmarks();

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				id: 1,
				url: "https://example.com/1",
				title: "Read Article",
				labels: ["Tech", "Backend"],
				isRead: true,
				isFavorite: true,
				createdAt: "2024-01-01T00:00:00Z",
				readAt: "2024-01-02T00:00:00Z",
			});
		});

		it("labelsが存在しない場合に空配列として処理する", async () => {
			const mockResponse = {
				success: true,
				bookmarks: [
					{
						id: 1,
						url: "https://example.com/1",
						title: "Read Article",
						// labelsが存在しない
						isRead: true,
						isFavorite: false,
						createdAt: "2024-01-01T00:00:00Z",
						readAt: "2024-01-02T00:00:00Z",
					},
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await getReadBookmarks();

			expect(result).toHaveLength(1);
			expect(result[0].labels).toEqual([]);
		});

		it("readAtがnullの場合を正しく処理する", async () => {
			const mockResponse = {
				success: true,
				bookmarks: [
					{
						id: 1,
						url: "https://example.com/1",
						title: "Read Article",
						labels: [],
						isRead: true,
						isFavorite: false,
						createdAt: "2024-01-01T00:00:00Z",
						readAt: null,
					},
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await getReadBookmarks();

			expect(result).toHaveLength(1);
			expect(result[0].readAt).toBeNull();
		});
	});
});

if (import.meta.vitest) {
	const { test } = import.meta.vitest;
	test("ファイル内テスト実行確認", () => {
		expect(true).toBe(true);
	});
}
