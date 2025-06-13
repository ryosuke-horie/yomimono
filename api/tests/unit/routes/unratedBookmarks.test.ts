/**
 * 未評価ブックマーク取得機能のルート層テスト
 */
import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BookmarkWithLabel } from "../../../src/interfaces/repository/bookmark";
import type { IBookmarkService } from "../../../src/interfaces/service/bookmark";
import type { ILabelService } from "../../../src/interfaces/service/label";
import { createBookmarksRouter } from "../../../src/routes/bookmarks";

// モックサービス
const mockBookmarkService: IBookmarkService = {
	getUnratedBookmarks: vi.fn(),
	getUnreadBookmarksCount: vi.fn(),
	getTodayReadCount: vi.fn(),
	getUnreadBookmarks: vi.fn(),
	createBookmarksFromData: vi.fn(),
	markBookmarkAsRead: vi.fn(),
	markBookmarkAsUnread: vi.fn(),
	addToFavorites: vi.fn(),
	removeFromFavorites: vi.fn(),
	getFavoriteBookmarks: vi.fn(),
	getRecentlyReadBookmarks: vi.fn(),
	getUnlabeledBookmarks: vi.fn(),
	getBookmarksByLabel: vi.fn(),
	getReadBookmarks: vi.fn(),
} as IBookmarkService;

// モックLabelService
const mockLabelService: Partial<ILabelService> = {
	getLabels: vi.fn(),
	createLabel: vi.fn(),
	deleteLabel: vi.fn(),
	assignLabel: vi.fn(),
	updateLabelDescription: vi.fn(),
	assignLabelsToMultipleArticles: vi.fn(),
	getLabelById: vi.fn(),
};

// モックデータ
const mockUnratedBookmarks: BookmarkWithLabel[] = [
	{
		id: 1,
		url: "https://example.com/article1",
		title: "未評価の記事1",
		isRead: false,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
		isFavorite: false,
		label: null,
	},
	{
		id: 2,
		url: "https://example.com/article2",
		title: "未評価の記事2",
		isRead: true,
		createdAt: new Date("2024-01-02"),
		updatedAt: new Date("2024-01-02"),
		isFavorite: true,
		label: {
			id: 1,
			name: "JavaScript",
			createdAt: new Date("2024-01-01"),
			updatedAt: new Date("2024-01-01"),
			description: null,
		},
	},
];

// JSON形式に変換されたモックデータ（レスポンス比較用）
const mockUnratedBookmarksJson = mockUnratedBookmarks.map((bookmark) => ({
	...bookmark,
	createdAt: bookmark.createdAt.toISOString(),
	updatedAt: bookmark.updatedAt.toISOString(),
	label: bookmark.label
		? {
				...bookmark.label,
				createdAt: bookmark.label.createdAt.toISOString(),
				updatedAt: bookmark.label.updatedAt.toISOString(),
			}
		: null,
}));

describe("BookmarksRouter - GET /unrated", () => {
	let app: Hono;

	beforeEach(() => {
		vi.clearAllMocks();
		app = new Hono();
		const router = createBookmarksRouter(
			mockBookmarkService as IBookmarkService,
			mockLabelService as ILabelService,
		);
		app.route("/api/bookmarks", router);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("未評価のブックマークを正常に取得する", async () => {
		// モックの設定
		vi.mocked(mockBookmarkService.getUnratedBookmarks).mockResolvedValue(
			mockUnratedBookmarks,
		);

		// リクエストの実行
		const res = await app.request("/api/bookmarks/unrated", {
			method: "GET",
		});

		// レスポンスの検証
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toEqual({
			success: true,
			bookmarks: mockUnratedBookmarksJson,
		});
		expect(mockBookmarkService.getUnratedBookmarks).toHaveBeenCalledTimes(1);
	});

	it("空の配列を返す場合も正常なレスポンスを返す", async () => {
		// モックの設定
		vi.mocked(mockBookmarkService.getUnratedBookmarks).mockResolvedValue([]);

		// リクエストの実行
		const res = await app.request("/api/bookmarks/unrated", {
			method: "GET",
		});

		// レスポンスの検証
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toEqual({
			success: true,
			bookmarks: [],
		});
	});

	it("サービスがエラーを投げた場合、500エラーを返す", async () => {
		// モックの設定
		vi.mocked(mockBookmarkService.getUnratedBookmarks).mockRejectedValue(
			new Error("Database error"),
		);

		// リクエストの実行
		const res = await app.request("/api/bookmarks/unrated", {
			method: "GET",
		});

		// レスポンスの検証
		expect(res.status).toBe(500);
		const json = await res.json();
		expect(json).toEqual({
			success: false,
			message: "Database error",
		});
	});

	it("メソッドがGET以外の場合は404を返す", async () => {
		// POSTリクエストの実行
		const res = await app.request("/api/bookmarks/unrated", {
			method: "POST",
		});

		// レスポンスの検証
		expect(res.status).toBe(404);
	});
});
