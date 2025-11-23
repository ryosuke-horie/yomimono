/**
 * ブックマークAPIのテスト
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "./api";

// グローバルfetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ブックマークAPI", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("createBookmark", () => {
		it("正常にブックマークを作成する", async () => {
			const mockResponse = {
				success: true,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			await api.createBookmark({
				title: "テスト記事",
				url: "https://example.com",
			});

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/bookmarks/bulk"),
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						bookmarks: [
							{
								title: "テスト記事",
								url: "https://example.com",
							},
						],
					}),
				},
			);
		});

		it("作成に失敗した場合エラーを投げる", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: () =>
					Promise.resolve({
						success: false,
						message: "Invalid data",
					}),
			});

			await expect(
				api.createBookmark({
					title: "テスト記事",
					url: "https://example.com",
				}),
			).rejects.toThrow("Invalid data");
		});
	});

	describe("getRecentlyReadBookmarks", () => {
		it("正常に最近のブックマークを取得する", async () => {
			const mockResponse = {
				success: true,
				bookmarks: {
					"2024-01-01": [
						{
							id: 1,
							title: "テスト記事",
							url: "https://example.com",
							createdAt: "2024-01-01T00:00:00.000Z",
							isRead: true,
							isFavorite: false,
							label: null,
						},
					],
				},
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve(JSON.stringify(mockResponse)),
			});

			const result = await api.getRecentlyReadBookmarks();

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/bookmarks/recent"),
				{
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
				},
			);
			expect(result).toEqual(mockResponse.bookmarks);
		});

		it("取得に失敗した場合エラーを投げる", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				text: () => Promise.resolve("Server Error"),
			});

			await expect(api.getRecentlyReadBookmarks()).rejects.toThrow(
				"Failed to fetch recently read bookmarks: 500",
			);
		});
	});

	describe("addBookmarkToFavorites", () => {
		it("正常にお気に入りに追加する", async () => {
			const mockResponse = {
				success: true,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			await api.addBookmarkToFavorites(1);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/bookmarks/1/favorite"),
				{
					method: "POST",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
				},
			);
		});

		it("追加に失敗した場合エラーを投げる", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
			});

			await expect(api.addBookmarkToFavorites(1)).rejects.toThrow(
				"Failed to add to favorites: 404",
			);
		});
	});

	describe("removeBookmarkFromFavorites", () => {
		it("正常にお気に入りから削除する", async () => {
			const mockResponse = {
				success: true,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			await api.removeBookmarkFromFavorites(1);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/bookmarks/1/favorite"),
				{
					method: "DELETE",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
				},
			);
		});

		it("削除に失敗した場合エラーを投げる", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
			});

			await expect(api.removeBookmarkFromFavorites(1)).rejects.toThrow(
				"Failed to remove from favorites: 404",
			);
		});
	});

	describe("markBookmarkAsRead", () => {
		it("正常にブックマークを既読にする", async () => {
			const mockResponse = {
				success: true,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve(JSON.stringify(mockResponse)),
			});

			await api.markBookmarkAsRead(1);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/bookmarks/1/read"),
				{
					method: "PATCH",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
				},
			);
		});

		it("既読処理に失敗した場合エラーを投げる", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
				text: () => Promise.resolve("Not Found"),
			});

			await expect(api.markBookmarkAsRead(1)).rejects.toThrow(
				"Failed to mark as read: 404",
			);
		});
	});

	describe("markBookmarkAsUnread", () => {
		it("正常にブックマークを未読にする", async () => {
			const mockResponse = {
				success: true,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve(JSON.stringify(mockResponse)),
			});

			await api.markBookmarkAsUnread(1);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/bookmarks/1/unread"),
				{
					method: "PATCH",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
				},
			);
		});

		it("未読処理に失敗した場合エラーを投げる", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
				text: () => Promise.resolve("Not Found"),
			});

			await expect(api.markBookmarkAsUnread(1)).rejects.toThrow(
				"Failed to mark as unread: 404",
			);
		});
	});

	describe("assignLabelToBookmark", () => {
		it("正常にラベルを付け替える", async () => {
			const mockResponse = {
				success: true,
				label: { id: 2, name: "新しいラベル" },
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve(JSON.stringify(mockResponse)),
			});

			const result = await api.assignLabelToBookmark(1, "新しいラベル");

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/bookmarks/1/label"),
				{
					method: "PUT",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ labelName: "新しいラベル" }),
				},
			);
			expect(result).toEqual({ id: 2, name: "新しいラベル" });
		});

		it("APIが失敗した場合にエラーを投げる", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				text: () => Promise.resolve("server error"),
			});

			await expect(
				api.assignLabelToBookmark(1, "テストラベル"),
			).rejects.toThrow("Failed to assign label: 500");
		});
	});
});
