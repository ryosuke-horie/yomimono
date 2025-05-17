import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Label } from "../../../src/db/schema";
import type { IBookmarkService } from "../../../src/interfaces/service/bookmark";
import type { ILabelService } from "../../../src/interfaces/service/label";
import { createBookmarksRouter } from "../../../src/routes/bookmarks";

vi.mock("../../../src/services/bookmark", () => ({
	BookmarkService: vi.fn(),
}));

vi.mock("../../../src/services/label", () => ({
	LabelService: vi.fn(),
}));

describe("PUT /bookmarks/batch-label", () => {
	let bookmarkService: IBookmarkService;
	let labelService: ILabelService;
	let router: ReturnType<typeof createBookmarksRouter>;

	beforeEach(() => {
		vi.clearAllMocks();

		bookmarkService = {
			getUnreadBookmarks: vi.fn(),
			getUnreadBookmarksCount: vi.fn(),
			getTodayReadCount: vi.fn(),
			markBookmarkAsRead: vi.fn(),
			addToFavorites: vi.fn(),
			removeFromFavorites: vi.fn(),
			getFavoriteBookmarks: vi.fn(),
			getRecentlyReadBookmarks: vi.fn(),
			getUnlabeledBookmarks: vi.fn(),
			getBookmarksByLabel: vi.fn(),
		} as unknown as IBookmarkService;

		labelService = {
			getLabels: vi.fn(),
			getLabelById: vi.fn(),
			assignLabel: vi.fn(),
			createLabel: vi.fn(),
			deleteLabel: vi.fn(),
			updateLabelDescription: vi.fn(),
			assignLabelsToMultipleArticles: vi.fn(),
		} as unknown as ILabelService;

		router = createBookmarksRouter(bookmarkService, labelService);
	});

	describe("正常系", () => {
		it("複数の記事に一括でラベルを付与できる", async () => {
			const mockLabel: Label = {
				id: 1,
				name: "javascript",
				description: "JavaScript関連記事",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockResult = {
				successful: 2,
				skipped: 1,
				errors: [],
				label: mockLabel,
			};

			vi.mocked(labelService.assignLabelsToMultipleArticles).mockResolvedValue(
				mockResult,
			);

			const response = await router.request("/batch-label", {
				method: "PUT",
				body: JSON.stringify({
					articleIds: [1, 2, 3],
					labelName: "javascript",
					description: "JavaScript関連記事",
				}),
				headers: {
					"Content-Type": "application/json",
				},
			});

			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.successful).toBe(2);
			expect(data.skipped).toBe(1);
			expect(data.errors).toEqual([]);
			expect(data.label.id).toBe(mockLabel.id);
			expect(data.label.name).toBe(mockLabel.name);
			expect(data.label.description).toBe(mockLabel.description);

			expect(labelService.assignLabelsToMultipleArticles).toHaveBeenCalledWith(
				[1, 2, 3],
				"javascript",
				"JavaScript関連記事",
			);
		});
	});

	describe("異常系", () => {
		it("articleIdsが指定されていない場合は400を返す", async () => {
			const response = await router.request("/batch-label", {
				method: "PUT",
				body: JSON.stringify({
					labelName: "javascript",
				}),
				headers: {
					"Content-Type": "application/json",
				},
			});

			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data).toEqual({
				success: false,
				message: "articleIds is required and must be a non-empty array",
			});
		});

		it("articleIdsが空の配列の場合は400を返す", async () => {
			const response = await router.request("/batch-label", {
				method: "PUT",
				body: JSON.stringify({
					articleIds: [],
					labelName: "javascript",
				}),
				headers: {
					"Content-Type": "application/json",
				},
			});

			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data).toEqual({
				success: false,
				message: "articleIds is required and must be a non-empty array",
			});
		});

		it("labelNameが指定されていない場合は400を返す", async () => {
			const response = await router.request("/batch-label", {
				method: "PUT",
				body: JSON.stringify({
					articleIds: [1, 2, 3],
				}),
				headers: {
					"Content-Type": "application/json",
				},
			});

			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data).toEqual({
				success: false,
				message: "labelName is required and must be a non-empty string",
			});
		});

		it("articleIdsに数値以外が含まれている場合は400を返す", async () => {
			const response = await router.request("/batch-label", {
				method: "PUT",
				body: JSON.stringify({
					articleIds: [1, "invalid", 3],
					labelName: "javascript",
				}),
				headers: {
					"Content-Type": "application/json",
				},
			});

			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.message).toContain("Invalid article ID");
		});

		it("サービスでエラーが発生した場合は500を返す", async () => {
			vi.mocked(labelService.assignLabelsToMultipleArticles).mockRejectedValue(
				new Error("Database error"),
			);

			const response = await router.request("/batch-label", {
				method: "PUT",
				body: JSON.stringify({
					articleIds: [1, 2, 3],
					labelName: "javascript",
				}),
				headers: {
					"Content-Type": "application/json",
				},
			});

			expect(response.status).toBe(500);
			const data = await response.json();
			expect(data).toEqual({
				success: false,
				message: "Failed to batch assign labels",
			});
		});
	});
});
