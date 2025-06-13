import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IBookmarkService } from "../../../src/interfaces/service/bookmark";
import type { ILabelService } from "../../../src/interfaces/service/label";
import { createBookmarksRouter } from "../../../src/routes/bookmarks";

// テスト用の型定義
interface ReadBookmarksResponse {
	success: true;
	bookmarks: Array<{
		id: number;
		url: string;
		title: string;
		labels: string[];
		isRead: boolean;
		isFavorite: boolean;
		createdAt: string;
		readAt: string;
	}>;
}

interface ErrorResponse {
	success: false;
	message: string;
}

describe("/api/bookmarks/read", () => {
	let app: Hono;
	let mockBookmarkService: IBookmarkService;
	let mockLabelService: ILabelService;

	beforeEach(() => {
		vi.clearAllMocks();

		mockBookmarkService = {
			getReadBookmarks: vi.fn(),
			getUnreadBookmarks: vi.fn(),
			createBookmarksFromData: vi.fn(),
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
			getUnratedBookmarks: vi.fn(),
		};

		mockLabelService = {
			assignLabel: vi.fn(),
			createLabel: vi.fn(),
			getLabels: vi.fn(),
			getLabelById: vi.fn(),
			updateLabelDescription: vi.fn(),
			deleteLabel: vi.fn(),
			assignLabelsToMultipleArticles: vi.fn(),
		};

		app = new Hono();
		app.route(
			"/api/bookmarks",
			createBookmarksRouter(mockBookmarkService, mockLabelService),
		);
	});

	describe("GET /api/bookmarks/read", () => {
		it("既読のブックマークリストを取得できる", async () => {
			const mockReadBookmarks = [
				{
					id: 1,
					url: "https://example.com/article1",
					title: "既読記事1",
					label: {
						id: 1,
						name: "tech",
						description: null,
						createdAt: new Date("2024-01-01"),
						updatedAt: new Date("2024-01-01"),
					},
					isRead: true,
					isFavorite: false,
					createdAt: new Date("2024-01-01"),
					updatedAt: new Date("2024-01-10"),
				},
				{
					id: 2,
					url: "https://example.com/article2",
					title: "既読記事2",
					label: null,
					isRead: true,
					isFavorite: true,
					createdAt: new Date("2024-01-02"),
					updatedAt: new Date("2024-01-11"),
				},
			];

			vi.mocked(mockBookmarkService.getReadBookmarks).mockResolvedValue(
				mockReadBookmarks,
			);

			const response = await app.request("/api/bookmarks/read");
			const json = (await response.json()) as ReadBookmarksResponse;

			expect(response.status).toBe(200);
			expect(json.bookmarks).toHaveLength(2);
			expect(json.bookmarks[0].title).toBe("既読記事1");
			expect(json.bookmarks[0].labels).toEqual(["tech"]);
			expect(json.bookmarks[1].title).toBe("既読記事2");
			expect(json.bookmarks[1].labels).toEqual([]);
			expect(mockBookmarkService.getReadBookmarks).toHaveBeenCalledOnce();
		});

		it("既読のブックマークがない場合空配列を返す", async () => {
			vi.mocked(mockBookmarkService.getReadBookmarks).mockResolvedValue([]);

			const response = await app.request("/api/bookmarks/read");
			const json = (await response.json()) as ReadBookmarksResponse;

			expect(response.status).toBe(200);
			expect(json.bookmarks).toEqual([]);
		});

		it("エラーが発生した場合500エラーを返す", async () => {
			vi.mocked(mockBookmarkService.getReadBookmarks).mockRejectedValue(
				new Error("Database error"),
			);

			const response = await app.request("/api/bookmarks/read");
			const json = (await response.json()) as ErrorResponse;

			expect(response.status).toBe(500);
			expect(json.message).toBe("既読ブックマークの取得に失敗しました");
		});
	});
});
