import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IBookmarkRepository } from "../../../src/interfaces/repository/bookmark";
import type { ILabelService } from "../../../src/interfaces/service/label";
import { createBookmarksRouter } from "../../../src/routes/bookmarks";
import { DefaultBookmarkService } from "../../../src/services/bookmark";

describe("GET /bookmarks/without-summary", () => {
	let mockBookmarkRepository: IBookmarkRepository;
	let mockLabelService: ILabelService;
	let bookmarkService: DefaultBookmarkService;
	let app: Hono;

	beforeEach(() => {
		// Mock repository
		mockBookmarkRepository = {
			findWithoutSummary: vi.fn(),
			createMany: vi.fn(),
			findUnread: vi.fn(),
			findByUrls: vi.fn(),
			markAsRead: vi.fn(),
			markAsUnread: vi.fn(), // Add missing method
			countUnread: vi.fn(),
			countTodayRead: vi.fn(),
			addToFavorites: vi.fn(),
			removeFromFavorites: vi.fn(),
			getFavoriteBookmarks: vi.fn(),
			isFavorite: vi.fn(),
			findRecentlyRead: vi.fn(),
			findRead: vi.fn(), // Add missing method
			findUnlabeled: vi.fn(),
			findByLabelName: vi.fn(),
			findById: vi.fn(),
			findByIds: vi.fn(),
			updateSummary: vi.fn(),
		};

		// Mock label service
		mockLabelService = {
			getLabels: vi.fn(), // Changed from getAllLabels
			getLabelById: vi.fn(), // Added missing method
			assignLabel: vi.fn(),
			assignLabelsToMultipleArticles: vi.fn(),
			createLabel: vi.fn(), // Added missing method
			deleteLabel: vi.fn(), // Added missing method
			updateLabelDescription: vi.fn(), // Added missing method
		};

		// Create services
		bookmarkService = new DefaultBookmarkService(mockBookmarkRepository);

		// Create app
		app = new Hono();
		const bookmarksRouter = createBookmarksRouter(
			bookmarkService,
			mockLabelService,
		);
		app.route("/bookmarks", bookmarksRouter);
	});

	it("デフォルトパラメータで要約なしブックマークを取得する", async () => {
		const mockBookmarks = [
			{
				id: 1,
				url: "https://example.com/article1",
				title: "記事1",
				isRead: false,
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-01"),
				readAt: null,
				summary: null,
				summaryCreatedAt: null,
				summaryUpdatedAt: null,
				isFavorite: false,
				label: null,
			},
			{
				id: 2,
				url: "https://example.com/article2",
				title: "記事2",
				isRead: true,
				createdAt: new Date("2024-01-02"),
				updatedAt: new Date("2024-01-02"),
				readAt: new Date("2024-01-02"),
				summary: null,
				summaryCreatedAt: null,
				summaryUpdatedAt: null,
				isFavorite: true,
				label: null,
			},
		];

		(
			mockBookmarkRepository.findWithoutSummary as ReturnType<typeof vi.fn>
		).mockResolvedValue(mockBookmarks);

		// Create a mock request for testing
		const res = await app.request("/bookmarks/without-summary");

		expect(res.status).toBe(200);
		expect(mockBookmarkRepository.findWithoutSummary).toHaveBeenCalledWith(
			6, // limit + 1 for pagination (default is 5)
			"createdAt", // default orderBy
			0, // default offset
		);

		const json = await res.json();
		expect(json).toMatchObject({
			bookmarks: [
				{
					id: 1,
					url: "https://example.com/article1",
					title: "記事1",
					createdAt: "2024-01-01T00:00:00.000Z",
					readAt: null,
					isFavorite: false,
				},
				{
					id: 2,
					url: "https://example.com/article2",
					title: "記事2",
					createdAt: "2024-01-02T00:00:00.000Z",
					readAt: "2024-01-02T00:00:00.000Z",
					isFavorite: true,
				},
			],
			total: 2,
			hasMore: false,
		});
	});

	it("パラメータ付きで要約なしブックマークを取得する", async () => {
		const mockBookmarks = [
			{
				id: 1,
				url: "https://example.com/article1",
				title: "記事1",
				isRead: false,
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-01"),
				readAt: null,
				summary: null,
				summaryCreatedAt: null,
				summaryUpdatedAt: null,
				isFavorite: false,
				label: null,
			},
		];

		(
			mockBookmarkRepository.findWithoutSummary as ReturnType<typeof vi.fn>
		).mockResolvedValue(mockBookmarks);

		const res = await app.request(
			"/bookmarks/without-summary?limit=5&orderBy=readAt&offset=10",
		);

		expect(res.status).toBe(200);
		expect(mockBookmarkRepository.findWithoutSummary).toHaveBeenCalledWith(
			6, // limit + 1
			"readAt",
			10,
		);

		const json = await res.json();
		expect(json).toMatchObject({
			bookmarks: [
				{
					id: 1,
					url: "https://example.com/article1",
					title: "記事1",
					isFavorite: false,
				},
			],
			total: 11,
			hasMore: false,
		});
	});

	it("無効なlimitパラメータでエラーを返す", async () => {
		const res = await app.request("/bookmarks/without-summary?limit=0");

		expect(res.status).toBe(400);
		const json = await res.json();
		expect(json).toMatchObject({
			success: false,
			message: "Invalid limit parameter",
		});
	});

	it("無効なoffsetパラメータでエラーを返す", async () => {
		const res = await app.request("/bookmarks/without-summary?offset=-1");

		expect(res.status).toBe(400);
		const json = await res.json();
		expect(json).toMatchObject({
			success: false,
			message: "Invalid offset parameter",
		});
	});

	it("無効なorderByパラメータでエラーを返す", async () => {
		const res = await app.request("/bookmarks/without-summary?orderBy=invalid");

		expect(res.status).toBe(400);
		const json = await res.json();
		expect(json).toMatchObject({
			success: false,
			message: "Invalid orderBy parameter",
		});
	});

	it("エラー処理が正しく動作する", async () => {
		(
			mockBookmarkRepository.findWithoutSummary as ReturnType<typeof vi.fn>
		).mockRejectedValue(new Error("Database error"));

		const res = await app.request("/bookmarks/without-summary");

		expect(res.status).toBe(500);
		const json = await res.json();
		expect(json).toMatchObject({
			success: false,
			message: "Failed to fetch bookmarks without summary",
		});
	});
});
