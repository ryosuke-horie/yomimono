/**
 * MCPサーバーのブックマーク関連機能のテスト
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { MockInstance } from "vitest";
import * as apiClient from "../lib/apiClient.js";

describe("Bookmark API Functions", () => {
	let fetchMock: MockInstance;
	const originalEnv = process.env.API_BASE_URL;

	beforeEach(() => {
		process.env.API_BASE_URL = "http://localhost:3000";
		fetchMock = vi.spyOn(global, "fetch");
	});

	afterEach(() => {
		if (originalEnv) {
			process.env.API_BASE_URL = originalEnv;
		} else {
			delete process.env.API_BASE_URL;
		}
		vi.restoreAllMocks();
	});

	describe("getBookmarkById", () => {
		test("正常に特定のブックマークを取得できること", async () => {
			const mockBookmark = {
				id: 1,
				url: "https://example.com/article",
				title: "Test Article",
				isRead: false,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					bookmark: mockBookmark,
				}),
			} as Response);

			const result = await apiClient.getBookmarkById(1);

			expect(fetchMock).toHaveBeenCalledWith(
				"http://localhost:3000/api/bookmarks/1",
			);
			expect(result).toEqual(mockBookmark);
		});

		test("存在しないブックマークIDでエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				statusText: "Not Found",
			} as Response);

			await expect(apiClient.getBookmarkById(999)).rejects.toThrow(
				"Failed to fetch bookmark 999: Not Found",
			);
		});

		test("不正なレスポンス形式でエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					// success: trueが欠けている
					bookmark: { id: 1 },
				}),
			} as Response);

			await expect(apiClient.getBookmarkById(1)).rejects.toThrow(
				"Invalid API response for bookmark 1:",
			);
		});
	});

	describe("getUnreadArticlesByLabel", () => {
		test("正常にラベルで未読記事を取得できること", async () => {
			const mockArticles = [
				{
					id: 1,
					title: "Tech Article 1",
					url: "https://example.com/1",
					isRead: false,
					label: {
						id: 1,
						name: "技術記事",
						description: "技術関連の記事",
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
				{
					id: 2,
					title: "Tech Article 2",
					url: "https://example.com/2",
					isRead: false,
					label: {
						id: 1,
						name: "技術記事",
						description: "技術関連の記事",
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
					createdAt: "2024-01-02T00:00:00Z",
					updatedAt: "2024-01-02T00:00:00Z",
				},
			];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					bookmarks: mockArticles,
				}),
			} as Response);

			const result = await apiClient.getUnreadArticlesByLabel("技術記事");

			expect(fetchMock).toHaveBeenCalledWith(
				"http://localhost:3000/api/bookmarks?label=%E6%8A%80%E8%A1%93%E8%A8%98%E4%BA%8B",
			);
			expect(result).toEqual(mockArticles);
		});

		test("特殊文字を含むラベル名が正しくエンコードされること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					bookmarks: [],
				}),
			} as Response);

			await apiClient.getUnreadArticlesByLabel("テスト & 開発");

			const callArgs = fetchMock.mock.calls[0];
			expect(callArgs[0]).toContain("label=%E3%83%86%E3%82%B9%E3%83%88%20%26%20%E9%96%8B%E7%99%BA");
		});

		test("APIエラー時に適切なエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				statusText: "Bad Request",
			} as Response);

			await expect(
				apiClient.getUnreadArticlesByLabel("無効なラベル"),
			).rejects.toThrow(
				'Failed to fetch unread articles for label "無効なラベル": Bad Request',
			);
		});

		test("空のラベル名でもAPIリクエストが送信されること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					bookmarks: [],
				}),
			} as Response);

			const result = await apiClient.getUnreadArticlesByLabel("");

			expect(fetchMock).toHaveBeenCalledWith(
				"http://localhost:3000/api/bookmarks?label=",
			);
			expect(result).toEqual([]);
		});
	});

	describe("getUnreadBookmarks", () => {
		test("正常に未読ブックマークを取得できること", async () => {
			const mockBookmarks = [
				{
					id: 1,
					title: "Unread Article 1",
					url: "https://example.com/1",
					isRead: false,
					label: null,
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
				{
					id: 2,
					title: "Unread Article 2",
					url: "https://example.com/2",
					isRead: false,
					label: {
						id: 1,
						name: "テスト",
						description: null,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
					createdAt: "2024-01-02T00:00:00Z",
					updatedAt: "2024-01-02T00:00:00Z",
				},
			];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					bookmarks: mockBookmarks,
				}),
			} as Response);

			const result = await apiClient.getUnreadBookmarks();

			expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/bookmarks");
			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({
				id: 1,
				url: "https://example.com/1",
				title: "Unread Article 1",
				isRead: false,
				labels: [],
				isFavorite: false,
				readAt: null,
			});
			expect(result[1]).toMatchObject({
				id: 2,
				url: "https://example.com/2",
				title: "Unread Article 2",
				isRead: false,
				labels: ["テスト"],
				isFavorite: false,
				readAt: null,
			});
		});

		test("APIエラー時に適切なエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				statusText: "Internal Server Error",
			} as Response);

			await expect(apiClient.getUnreadBookmarks()).rejects.toThrow(
				"Failed to fetch unread bookmarks: Internal Server Error",
			);
		});

		test("isFavoriteがundefinedの場合falseに変換されること", async () => {
			const mockBookmarks = [
				{
					id: 1,
					title: "Article",
					url: "https://example.com",
					isRead: false,
					// isFavoriteが未定義
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
			];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					bookmarks: mockBookmarks,
				}),
			} as Response);

			const result = await apiClient.getUnreadBookmarks();
			expect(result[0].isFavorite).toBe(false);
		});

		test("Dateオブジェクトの日付を文字列に変換すること", async () => {
			const now = new Date();
			const mockBookmarks = [
				{
					id: 1,
					title: "Article",
					url: "https://example.com",
					isRead: false,
					createdAt: now,
					updatedAt: now,
				},
			];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					bookmarks: mockBookmarks,
				}),
			} as Response);

			const result = await apiClient.getUnreadBookmarks();
			expect(result[0].createdAt).toBe(now.toISOString());
			expect(result[0].updatedAt).toBe(now.toISOString());
		});
	});

	describe("getReadBookmarks", () => {
		test("正常に既読ブックマークを取得できること", async () => {
			const mockBookmarks = [
				{
					id: 1,
					url: "https://example.com/1",
					title: "Read Article 1",
					labels: ["技術", "JavaScript"],
					isRead: true,
					isFavorite: true,
					createdAt: "2024-01-01T00:00:00Z",
					readAt: "2024-01-05T10:00:00Z",
					updatedAt: "2024-01-05T10:00:00Z",
				},
				{
					id: 2,
					url: "https://example.com/2",
					title: "Read Article 2",
					labels: [],
					isRead: true,
					isFavorite: false,
					createdAt: "2024-01-02T00:00:00Z",
					readAt: "2024-01-06T10:00:00Z",
					updatedAt: "2024-01-06T10:00:00Z",
				},
			];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					bookmarks: mockBookmarks,
				}),
			} as Response);

			const result = await apiClient.getReadBookmarks();

			expect(fetchMock).toHaveBeenCalledWith(
				"http://localhost:3000/api/bookmarks/read",
			);
			expect(result).toEqual(mockBookmarks);
		});

		test("APIエラー時に適切なエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				statusText: "Service Unavailable",
			} as Response);

			await expect(apiClient.getReadBookmarks()).rejects.toThrow(
				"Failed to fetch read bookmarks: Service Unavailable",
			);
		});

		test("不正なレスポンス形式でエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					// bookmarksではなくitemsというキー
					items: [],
				}),
			} as Response);

			await expect(apiClient.getReadBookmarks()).rejects.toThrow(
				"Invalid API response for read bookmarks:",
			);
		});

		test("labelsがundefinedの場合空配列に変換されること", async () => {
			const mockBookmarks = [
				{
					id: 1,
					url: "https://example.com",
					title: "Article",
					// labelsが未定義
					isRead: true,
					createdAt: "2024-01-01T00:00:00Z",
					readAt: "2024-01-05T10:00:00Z",
				},
			];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					bookmarks: mockBookmarks,
				}),
			} as Response);

			const result = await apiClient.getReadBookmarks();
			expect(result[0].labels).toEqual([]);
		});

		test("isFavoriteがundefinedの場合falseに変換されること", async () => {
			const mockBookmarks = [
				{
					id: 1,
					url: "https://example.com",
					title: "Article",
					labels: ["test"],
					isRead: true,
					// isFavoriteが未定義
					createdAt: "2024-01-01T00:00:00Z",
					readAt: "2024-01-05T10:00:00Z",
				},
			];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					bookmarks: mockBookmarks,
				}),
			} as Response);

			const result = await apiClient.getReadBookmarks();
			expect(result[0].isFavorite).toBe(false);
		});
	});

	describe("markBookmarkAsRead", () => {
		test("正常にブックマークを既読にマークできること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					message: "Bookmark marked as read successfully",
				}),
			} as Response);

			const result = await apiClient.markBookmarkAsRead(1);

			expect(fetchMock).toHaveBeenCalledWith(
				"http://localhost:3000/api/bookmarks/1/read",
				{
					method: "PATCH",
				},
			);
			expect(result).toEqual({
				success: true,
				message: "Bookmark marked as read successfully",
			});
		});

		test("存在しないブックマークIDでエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				statusText: "Not Found",
			} as Response);

			await expect(apiClient.markBookmarkAsRead(999)).rejects.toThrow(
				"Failed to mark bookmark 999 as read: Not Found",
			);
		});

		test("既に既読のブックマークでも成功すること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					message: "Bookmark already marked as read",
				}),
			} as Response);

			const result = await apiClient.markBookmarkAsRead(1);

			expect(result.message).toBe("Bookmark already marked as read");
		});

		test("不正なレスポンス形式でエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					// success: trueが欠けている
					message: "Bookmark marked as read",
				}),
			} as Response);

			await expect(apiClient.markBookmarkAsRead(1)).rejects.toThrow(
				"Invalid API response after marking bookmark as read:",
			);
		});
	});

	describe("cleanupUnusedLabels", () => {
		test("正常に未使用ラベルをクリーンアップできること", async () => {
			const mockResponse = {
				success: true,
				message: "Cleanup completed successfully",
				deletedCount: 3,
				deletedLabels: [
					{ id: 1, name: "未使用1" },
					{ id: 2, name: "未使用2" },
					{ id: 3, name: "未使用3" },
				],
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			} as Response);

			const result = await apiClient.cleanupUnusedLabels();

			expect(fetchMock).toHaveBeenCalledWith(
				"http://localhost:3000/api/labels/cleanup",
				{
					method: "DELETE",
				},
			);
			expect(result).toEqual({
				deletedCount: 3,
				deletedLabels: mockResponse.deletedLabels,
				message: "Cleanup completed successfully",
			});
		});

		test("削除対象がない場合も正常に処理できること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					message: "No unused labels found",
					deletedCount: 0,
					deletedLabels: [],
				}),
			} as Response);

			const result = await apiClient.cleanupUnusedLabels();

			expect(result.deletedCount).toBe(0);
			expect(result.deletedLabels).toEqual([]);
		});

		test("APIエラー時に適切なエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				json: async () => ({
					message: "Database error during cleanup",
				}),
			} as Response);

			await expect(apiClient.cleanupUnusedLabels()).rejects.toThrow(
				"Database error during cleanup: Internal Server Error (Status: 500)",
			);
		});

		test("JSONパースエラー時に適切なエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				json: async () => {
					throw new Error("Invalid JSON");
				},
			} as Response);

			await expect(apiClient.cleanupUnusedLabels()).rejects.toThrow(
				"Failed to cleanup unused labels. Status: 500 Internal Server Error",
			);
		});

		test("不正なレスポンス形式でエラーをスローすること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					// requiredフィールドが欠けている
					message: "Cleanup completed",
				}),
			} as Response);

			await expect(apiClient.cleanupUnusedLabels()).rejects.toThrow(
				"Invalid API response after cleaning up labels. Zod errors:",
			);
		});
	});

	describe("複数API呼び出しの組み合わせ", () => {
		test("ブックマークを取得して既読にマークするフロー", async () => {
			// 1. 未読ブックマークを取得
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					bookmarks: [
						{
							id: 1,
							title: "Article",
							url: "https://example.com",
							isRead: false,
							createdAt: "2024-01-01T00:00:00Z",
							updatedAt: "2024-01-01T00:00:00Z",
						},
					],
				}),
			} as Response);

			const unreadBookmarks = await apiClient.getUnreadBookmarks();
			expect(unreadBookmarks).toHaveLength(1);

			// 2. ブックマークを既読にマーク
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					message: "Marked as read",
				}),
			} as Response);

			await apiClient.markBookmarkAsRead(unreadBookmarks[0].id);

			// 3. 既読ブックマークを取得して確認
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					bookmarks: [
						{
							id: 1,
							url: "https://example.com",
							title: "Article",
							labels: [],
							isRead: true,
							isFavorite: false,
							createdAt: "2024-01-01T00:00:00Z",
							readAt: "2024-01-05T10:00:00Z",
							updatedAt: "2024-01-05T10:00:00Z",
						},
					],
				}),
			} as Response);

			const readBookmarks = await apiClient.getReadBookmarks();
			expect(readBookmarks).toHaveLength(1);
			expect(readBookmarks[0].isRead).toBe(true);
			expect(readBookmarks[0].readAt).toBeDefined();
		});
	});
});