import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	addBookmarkToFavorites,
	assignLabelToBookmark,
	createBookmark,
	getBookmarks,
	getFavoriteBookmarks,
	getRecentlyReadBookmarks,
	markBookmarkAsRead,
	markBookmarkAsUnread,
	removeBookmarkFromFavorites,
} from "./api";

const ORIGINAL_FETCH = global.fetch;
const mockFetch = vi.fn();

const createResponse = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});

beforeEach(() => {
	mockFetch.mockReset();
	global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
	global.fetch = ORIGINAL_FETCH;
});

describe("ブックマークAPI (BFF 経由)", () => {
	it("ラベル指定でブックマークリストを取得する", async () => {
		mockFetch.mockResolvedValueOnce(
			createResponse({
				success: true,
				bookmarks: [
					{
						id: 1,
						title: "test",
						url: "https://example.com",
						isRead: false,
						isFavorite: false,
						label: null,
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-01T00:00:00.000Z",
					},
				],
				totalUnread: 5,
				todayReadCount: 1,
			}),
		);

		const result = await getBookmarks("tech");

		expect(result.bookmarks[0]).toMatchObject({
			id: 1,
			url: "https://example.com",
		});
		expect(mockFetch).toHaveBeenCalledWith(
			"/api/bookmarks?label=tech",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("エラーレスポンスは例外として扱う", async () => {
		mockFetch.mockResolvedValueOnce(
			createResponse({ success: false, message: "server error" }, 500),
		);

		await expect(getBookmarks()).rejects.toThrow("server error");
	});

	it("お気に入り一覧を取得する", async () => {
		mockFetch.mockResolvedValueOnce(
			createResponse({
				success: true,
				bookmarks: [],
			}),
		);

		await getFavoriteBookmarks();

		expect(mockFetch).toHaveBeenCalledWith(
			"/api/bookmarks/favorites",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("最近読んだブックマークリストを返す", async () => {
		mockFetch.mockResolvedValueOnce(
			createResponse({
				success: true,
				bookmarks: {
					"2024-01-01": [
						{
							id: 1,
							title: "test",
							url: "https://example.com",
							isRead: true,
							isFavorite: false,
							label: null,
							createdAt: "2024-01-01T00:00:00.000Z",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
				},
			}),
		);

		const result = await getRecentlyReadBookmarks();
		expect(result["2024-01-01"]).toHaveLength(1);
		expect(mockFetch).toHaveBeenCalledWith(
			"/api/bookmarks/recent",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("既読/未読の更新を呼び出す", async () => {
		mockFetch.mockImplementation(() =>
			Promise.resolve(createResponse({ success: true })),
		);

		await markBookmarkAsRead(1);
		await markBookmarkAsUnread(1);

		expect(mockFetch).toHaveBeenCalledWith(
			"/api/bookmarks/1/read",
			expect.objectContaining({ method: "PATCH" }),
		);
		expect(mockFetch).toHaveBeenCalledWith(
			"/api/bookmarks/1/unread",
			expect.objectContaining({ method: "PATCH" }),
		);
	});

	it("ラベル付与を実行する", async () => {
		mockFetch.mockResolvedValueOnce(
			createResponse({
				success: true,
				label: {
					id: 10,
					name: "Tech",
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
			}),
		);

		const result = await assignLabelToBookmark(5, "Tech");

		expect(result.name).toBe("Tech");
		expect(mockFetch).toHaveBeenCalledWith(
			"/api/bookmarks/5/label",
			expect.objectContaining({
				method: "PUT",
				body: JSON.stringify({ labelName: "Tech" }),
			}),
		);
	});

	it("お気に入り追加/削除を実行する", async () => {
		mockFetch.mockResolvedValueOnce(createResponse({ success: true }));
		mockFetch.mockResolvedValueOnce(createResponse({ success: true }));

		await addBookmarkToFavorites(3);
		await removeBookmarkFromFavorites(3);

		expect(mockFetch).toHaveBeenCalledWith(
			"/api/bookmarks/3/favorite",
			expect.objectContaining({ method: "POST" }),
		);
		expect(mockFetch).toHaveBeenCalledWith(
			"/api/bookmarks/3/favorite",
			expect.objectContaining({ method: "DELETE" }),
		);
	});

	it("ブックマーク作成をBFF経由で呼び出す", async () => {
		mockFetch.mockResolvedValueOnce(
			createResponse({
				success: true,
				message: "ok",
			}),
		);

		await createBookmark({ title: "新規", url: "https://example.com" });

		expect(mockFetch).toHaveBeenCalledWith(
			"/api/bookmarks/bulk",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({
					bookmarks: [{ title: "新規", url: "https://example.com" }],
				}),
			}),
		);
	});
});
