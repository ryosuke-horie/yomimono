import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IBookmarkService } from "../../../src/interfaces/service/bookmark";
import type { ILabelService } from "../../../src/interfaces/service/label";
import { createBookmarksRouter } from "../../../src/routes/bookmarks";

// Define a type for the context object used in tests
interface MockContext {
	req: {
		param: (name: string) => string;
	};
	json: (data: unknown, status?: number) => unknown;
}

describe("bookmarks router", () => {
	// モックの設定
	let mockBookmarkService: IBookmarkService;
	let mockLabelService: ILabelService;
	let app: ReturnType<typeof createBookmarksRouter>;

	beforeEach(() => {
		mockBookmarkService = {
			getUnreadBookmarks: vi.fn(),
			markBookmarkAsRead: vi.fn(),
			markBookmarkAsUnread: vi.fn(),
			getUnreadBookmarksCount: vi.fn(),
			getTodayReadCount: vi.fn(),
			createBookmarksFromData: vi.fn(),
			addToFavorites: vi.fn(),
			removeFromFavorites: vi.fn(),
			getFavoriteBookmarks: vi.fn(),
			getRecentlyReadBookmarks: vi.fn(),
			getUnlabeledBookmarks: vi.fn(),
			getBookmarksByLabel: vi.fn(),
			getBookmarksWithoutSummary: vi.fn(),
			getReadBookmarks: vi.fn(),
		};

		mockLabelService = {
			getLabels: vi.fn(), // Fixed method name from getAllLabels to getLabels
			getLabelById: vi.fn(),
			assignLabel: vi.fn(),
			assignLabelsToMultipleArticles: vi.fn(),
			createLabel: vi.fn(),
			deleteLabel: vi.fn(),
			updateLabelDescription: vi.fn(), // Fixed method name from updateLabel to updateLabelDescription
		};

		app = createBookmarksRouter(mockBookmarkService, mockLabelService);
	});

	describe("PATCH /:id/unread", () => {
		it("有効なIDの場合、ブックマークを未読に戻す", async () => {
			// モックの設定
			mockBookmarkService.markBookmarkAsUnread = vi
				.fn()
				.mockResolvedValue(undefined);

			// リクエストの作成
			const request = new Request("http://localhost/123/unread", {
				method: "PATCH",
			});
			const c = {
				req: {
					param: vi.fn().mockReturnValue("123"),
				},
				json: vi
					.fn()
					.mockImplementation((data, status) => ({ ...data, status })),
			};

			// 実行
			const result = await app.fetch(request, c as MockContext);
			const responseData = await result.json() as { success: boolean; message?: string };

			// 検証
			expect(mockBookmarkService.markBookmarkAsUnread).toHaveBeenCalledWith(
				123,
			);
			expect(responseData).toEqual({ success: true });
		});

		it("無効なIDの場合、400エラーを返す", async () => {
			// リクエストの作成
			const request = new Request("http://localhost/invalid/unread", {
				method: "PATCH",
			});
			const c = {
				req: {
					param: vi.fn().mockReturnValue("invalid"),
				},
				json: vi
					.fn()
					.mockImplementation((data, status) => ({ ...data, status })),
			};

			// 実行
			const result = await app.fetch(request, c as MockContext);
			const responseData = await result.json() as { success: boolean; message?: string };

			// 検証
			expect(mockBookmarkService.markBookmarkAsUnread).not.toHaveBeenCalled();
			expect(responseData.success).toBe(false);
			expect(responseData.message).toBe("Invalid bookmark ID");
		});

		it("存在しないブックマークの場合、404エラーを返す", async () => {
			// モックの設定
			mockBookmarkService.markBookmarkAsUnread = vi
				.fn()
				.mockRejectedValue(new Error("Bookmark not found"));

			// リクエストの作成
			const request = new Request("http://localhost/999/unread", {
				method: "PATCH",
			});
			const c = {
				req: {
					param: vi.fn().mockReturnValue("999"),
				},
				json: vi
					.fn()
					.mockImplementation((data, status) => ({ ...data, status })),
			};

			// 実行
			const result = await app.fetch(request, c as MockContext);
			const responseData = await result.json() as { success: boolean; message?: string };

			// 検証
			expect(mockBookmarkService.markBookmarkAsUnread).toHaveBeenCalledWith(
				999,
			);
			expect(responseData.success).toBe(false);
			expect(responseData.message).toBe("Bookmark not found");
		});
	});
});
