/**
 * 未評価ブックマーク取得機能のテスト
 * Route層のGET /api/bookmarks/unratedエンドポイントをテスト
 */

import { Hono } from "hono";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { BookmarkWithLabel } from "../../../src/interfaces/repository/bookmark";
import type { IBookmarkService } from "../../../src/interfaces/service/bookmark";
import type { ILabelService } from "../../../src/interfaces/service/label";
import { createBookmarksRouter } from "../../../src/routes/bookmarks";

describe("GET /api/bookmarks/unrated", () => {
	let app: Hono;
	let mockBookmarkService: IBookmarkService;
	let mockLabelService: ILabelService;

	beforeEach(() => {
		// モックサービスの作成
		mockBookmarkService = {
			getUnratedBookmarks: vi.fn(),
			// 他のメソッドはテストで使用しないためvi.fn()で代替
			createBookmarksFromData: vi.fn(),
			getUnreadBookmarks: vi.fn(),
			markBookmarkAsRead: vi.fn(),
			markBookmarkAsUnread: vi.fn(),
			getUnreadBookmarksCount: vi.fn(),
			getTodayReadCount: vi.fn(),
			addToFavorites: vi.fn(),
			removeFromFavorites: vi.fn(),
			getFavoriteBookmarks: vi.fn(),
			getRecentlyReadBookmarks: vi.fn(),
			getUnlabeledBookmarks: vi.fn(),
			getBookmarksByLabel: vi.fn(),
			getReadBookmarks: vi.fn(),
		};

		mockLabelService = {
			// ラベルサービスのメソッドをvi.fn()で代替
			assignLabel: vi.fn(),
			assignLabelsToMultipleArticles: vi.fn(),
		} as unknown as ILabelService;

		// ルーターの作成
		app = new Hono();
		app.route(
			"/",
			createBookmarksRouter(mockBookmarkService, mockLabelService),
		);
	});

	test("未評価記事を正常に取得して返す", async () => {
		// モックデータの準備
		const mockUnratedBookmarks: BookmarkWithLabel[] = [
			{
				id: 1,
				url: "https://example.com/unrated-1",
				title: "未評価記事1",
				isRead: false,
				isFavorite: false,
				label: null,
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-01"),
			},
			{
				id: 2,
				url: "https://example.com/unrated-2",
				title: "未評価記事2",
				isRead: true,
				isFavorite: true,
				label: {
					id: 1,
					name: "React",
					description: "React関連記事",
					createdAt: new Date("2024-01-01"),
					updatedAt: new Date("2024-01-01"),
				},
				createdAt: new Date("2024-01-02"),
				updatedAt: new Date("2024-01-02"),
			},
		];

		vi.mocked(mockBookmarkService.getUnratedBookmarks).mockResolvedValue(
			mockUnratedBookmarks,
		);

		// 実行
		const response = await app.request("/unrated", { method: "GET" });

		// 検証
		expect(response.status).toBe(200);
		const body = await response.json();

		// HTTPレスポンスではDateがJSONシリアライズされて文字列になるため、文字列で検証
		expect(body).toEqual({
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
						name: "React",
						description: "React関連記事",
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-01T00:00:00.000Z",
					},
					createdAt: "2024-01-02T00:00:00.000Z",
					updatedAt: "2024-01-02T00:00:00.000Z",
				},
			],
		});
		expect(mockBookmarkService.getUnratedBookmarks).toHaveBeenCalledOnce();
	});

	test("未評価記事が存在しない場合は空配列を返す", async () => {
		// モックの設定
		vi.mocked(mockBookmarkService.getUnratedBookmarks).mockResolvedValue([]);

		// 実行
		const response = await app.request("/unrated", { method: "GET" });

		// 検証
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({
			success: true,
			bookmarks: [],
		});
		expect(mockBookmarkService.getUnratedBookmarks).toHaveBeenCalledOnce();
	});

	test("サービス層でエラーが発生した場合は500エラーを返す", async () => {
		// モックの設定
		const mockError = new Error("Service error");
		vi.mocked(mockBookmarkService.getUnratedBookmarks).mockRejectedValue(
			mockError,
		);

		// 実行
		const response = await app.request("/unrated", { method: "GET" });

		// 検証
		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body).toEqual({
			success: false,
			message: "Failed to fetch unrated bookmarks",
		});
		expect(mockBookmarkService.getUnratedBookmarks).toHaveBeenCalledOnce();
	});

	test("POST・PUT・DELETEメソッドはサポートしない", async () => {
		// 実行と検証
		const postResponse = await app.request("/unrated", { method: "POST" });
		expect(postResponse.status).toBe(404);

		const putResponse = await app.request("/unrated", { method: "PUT" });
		expect(putResponse.status).toBe(404);

		const deleteResponse = await app.request("/unrated", { method: "DELETE" });
		expect(deleteResponse.status).toBe(404);
	});
});
