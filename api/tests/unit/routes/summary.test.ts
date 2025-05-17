import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Bookmark } from "../../../src/db/schema";
import type { BookmarkWithLabel } from "../../../src/interfaces/repository/bookmark";
import type { ISummaryService } from "../../../src/interfaces/service/summary";
import { createSummaryRouter } from "../../../src/routes/summary";
import { mockContext } from "../../test-utils";

describe("Summary Routes", () => {
	let app: ReturnType<typeof createSummaryRouter>;
	let mockSummaryService: ISummaryService;

	const mockBookmark: Bookmark = {
		id: 1,
		url: "https://example.com",
		title: "Example Article",
		isRead: false,
		summary: null,
		summaryCreatedAt: null,
		summaryUpdatedAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockBookmarkWithLabel: BookmarkWithLabel = {
		...mockBookmark,
		isFavorite: false,
		label: null,
	};

	const mockBookmarksWithoutSummary: Bookmark[] = [
		mockBookmark,
		{
			id: 2,
			url: "https://example2.com",
			title: "Example Article 2",
			isRead: false,
			summary: null,
			summaryCreatedAt: null,
			summaryUpdatedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	];

	beforeEach(() => {
		mockSummaryService = {
			getBookmarksWithoutSummary: vi.fn(),
			getBookmarkById: vi.fn(),
			saveSummary: vi.fn(),
			updateSummary: vi.fn(),
		};

		app = createSummaryRouter(mockSummaryService);
	});

	describe("GET /bookmarks/without-summary", () => {
		test("要約なしブックマークを正常に取得できること", async () => {
			vi.mocked(
				mockSummaryService.getBookmarksWithoutSummary,
			).mockResolvedValue(mockBookmarksWithoutSummary);

			const response = await app.request(
				"/bookmarks/without-summary",
				undefined,
				mockContext,
			);

			expect(response.status).toBe(200);
			const json = await response.json();
			expect(json).toEqual({
				success: true,
				bookmarks: mockBookmarksWithoutSummary.map(b => ({
					...b,
					createdAt: b.createdAt.toISOString(),
					updatedAt: b.updatedAt.toISOString(),
				})),
			});
			expect(
				mockSummaryService.getBookmarksWithoutSummary,
			).toHaveBeenCalledWith(undefined, undefined);
		});

		test("クエリパラメータが機能すること", async () => {
			vi.mocked(
				mockSummaryService.getBookmarksWithoutSummary,
			).mockResolvedValue([]);

			const response = await app.request(
				"/bookmarks/without-summary?limit=50&orderBy=createdAt",
				undefined,
				mockContext,
			);

			expect(response.status).toBe(200);
			expect(
				mockSummaryService.getBookmarksWithoutSummary,
			).toHaveBeenCalledWith(50, "createdAt");
		});

		test("エラー時に500エラーを返すこと", async () => {
			vi.mocked(
				mockSummaryService.getBookmarksWithoutSummary,
			).mockRejectedValue(new Error("Database error"));

			const response = await app.request(
				"/bookmarks/without-summary",
				undefined,
				mockContext,
			);

			expect(response.status).toBe(500);
			const json = await response.json();
			expect(json).toEqual({
				success: false,
				error: "Failed to get bookmarks without summary",
			});
		});
	});

	describe("GET /bookmarks/:id", () => {
		test("IDで指定されたブックマークを正常に取得できること", async () => {
			vi.mocked(mockSummaryService.getBookmarkById).mockResolvedValue(
				mockBookmarkWithLabel,
			);

			const response = await app.request(
				"/bookmarks/1",
				undefined,
				mockContext,
			);

			expect(response.status).toBe(200);
			const json = await response.json();
			expect(json).toEqual({ 
				success: true, 
				bookmark: {
					...mockBookmarkWithLabel,
					createdAt: mockBookmarkWithLabel.createdAt.toISOString(),
					updatedAt: mockBookmarkWithLabel.updatedAt.toISOString(),
				}
			});
			expect(mockSummaryService.getBookmarkById).toHaveBeenCalledWith(1);
		});

		test("ブックマークが見つからない場合は404エラーを返すこと", async () => {
			vi.mocked(mockSummaryService.getBookmarkById).mockRejectedValue(
				new Error("Bookmark not found"),
			);

			const response = await app.request(
				"/bookmarks/999",
				undefined,
				mockContext,
			);

			expect(response.status).toBe(404);
			const json = await response.json();
			expect(json).toEqual({ success: false, error: "Bookmark not found" });
		});

		test("その他のエラー時に500エラーを返すこと", async () => {
			vi.mocked(mockSummaryService.getBookmarkById).mockRejectedValue(
				new Error("Database error"),
			);

			const response = await app.request(
				"/bookmarks/1",
				undefined,
				mockContext,
			);

			expect(response.status).toBe(500);
			const json = await response.json();
			expect(json).toEqual({ success: false, error: "Database error" });
		});
	});

	describe("POST /bookmarks/:id/summary", () => {
		test("新規要約を正常に作成できること", async () => {
			const createdSummary = {
				...mockBookmarkWithLabel,
				summary: "これは要約です",
				summaryCreatedAt: new Date(),
				summaryUpdatedAt: new Date(),
			};

			vi.mocked(mockSummaryService.saveSummary).mockResolvedValue(
				createdSummary,
			);

			const response = await app.request(
				"/bookmarks/1/summary",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ summary: "これは要約です" }),
				},
				mockContext,
			);

			expect(response.status).toBe(200);
			const json = await response.json();
			expect(json).toEqual({ 
				success: true, 
				bookmark: {
					...createdSummary,
					createdAt: createdSummary.createdAt.toISOString(),
					updatedAt: createdSummary.updatedAt.toISOString(),
					summaryCreatedAt: createdSummary.summaryCreatedAt.toISOString(),
					summaryUpdatedAt: createdSummary.summaryUpdatedAt.toISOString(),
				}
			});
			expect(mockSummaryService.saveSummary).toHaveBeenCalledWith({
				bookmarkId: 1,
				summary: "これは要約です",
			});
		});

		test("無効なリクエストボディの場合400エラーを返すこと", async () => {
			const response = await app.request(
				"/bookmarks/1/summary",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				},
				mockContext,
			);

			expect(response.status).toBe(400);
			const json = await response.json();
			expect(json).toEqual({ success: false, error: "Summary is required" });
		});

		test("ブックマークが見つからない場合は404エラーを返すこと", async () => {
			vi.mocked(mockSummaryService.saveSummary).mockRejectedValue(
				new Error("Bookmark not found"),
			);

			const response = await app.request(
				"/bookmarks/999/summary",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ summary: "要約" }),
				},
				mockContext,
			);

			expect(response.status).toBe(404);
			const json = await response.json();
			expect(json).toEqual({ success: false, error: "Bookmark not found" });
		});

		test("その他のエラー時に500エラーを返すこと", async () => {
			vi.mocked(mockSummaryService.saveSummary).mockRejectedValue(
				new Error("Database error"),
			);

			const response = await app.request(
				"/bookmarks/1/summary",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ summary: "要約" }),
				},
				mockContext,
			);

			expect(response.status).toBe(500);
			const json = await response.json();
			expect(json).toEqual({ success: false, error: "Database error" });
		});
	});

	describe("PUT /bookmarks/:id/summary", () => {
		test("要約を正常に更新できること", async () => {
			const updatedSummary = {
				...mockBookmarkWithLabel,
				summary: "更新された要約",
				summaryCreatedAt: new Date("2024-01-01"),
				summaryUpdatedAt: new Date(),
			};

			vi.mocked(mockSummaryService.updateSummary).mockResolvedValue(
				updatedSummary,
			);

			const response = await app.request(
				"/bookmarks/1/summary",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ summary: "更新された要約" }),
				},
				mockContext,
			);

			expect(response.status).toBe(200);
			const json = await response.json();
			expect(json).toEqual({ 
				success: true, 
				bookmark: {
					...updatedSummary,
					createdAt: updatedSummary.createdAt.toISOString(),
					updatedAt: updatedSummary.updatedAt.toISOString(),
					summaryCreatedAt: updatedSummary.summaryCreatedAt.toISOString(),
					summaryUpdatedAt: updatedSummary.summaryUpdatedAt.toISOString(),
				}
			});
			expect(mockSummaryService.updateSummary).toHaveBeenCalledWith({
				bookmarkId: 1,
				summary: "更新された要約",
			});
		});

		test("無効なリクエストボディの場合400エラーを返すこと", async () => {
			const response = await app.request(
				"/bookmarks/1/summary",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				},
				mockContext,
			);

			expect(response.status).toBe(400);
			const json = await response.json();
			expect(json).toEqual({ success: false, error: "Summary is required" });
		});

		test("ブックマークが見つからない場合は404エラーを返すこと", async () => {
			vi.mocked(mockSummaryService.updateSummary).mockRejectedValue(
				new Error("Bookmark not found"),
			);

			const response = await app.request(
				"/bookmarks/999/summary",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ summary: "更新要約" }),
				},
				mockContext,
			);

			expect(response.status).toBe(404);
			const json = await response.json();
			expect(json).toEqual({ success: false, error: "Bookmark not found" });
		});

		test("その他のエラー時に500エラーを返すこと", async () => {
			vi.mocked(mockSummaryService.updateSummary).mockRejectedValue(
				new Error("Database error"),
			);

			const response = await app.request(
				"/bookmarks/1/summary",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ summary: "更新要約" }),
				},
				mockContext,
			);

			expect(response.status).toBe(500);
			const json = await response.json();
			expect(json).toEqual({ success: false, error: "Database error" });
		});
	});
});
