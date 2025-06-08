import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../lib/apiClient";

vi.mock("../lib/apiClient", () => ({
	getUnreadBookmarks: vi.fn(),
	getReadBookmarks: vi.fn(),
	markBookmarkAsRead: vi.fn(),
}));

describe("Read/Unread Bookmarks MCP API Client", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getUnreadBookmarks", () => {
		it("未読のブックマークリストを取得できる", async () => {
			const mockUnreadBookmarks = [
				{
					id: 1,
					url: "https://example.com/article1",
					title: "未読記事1",
					labels: ["tech", "AI"],
					isRead: false,
					isFavorite: false,
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
					readAt: null,
				},
				{
					id: 2,
					url: "https://example.com/article2",
					title: "未読記事2",
					labels: ["web"],
					isRead: false,
					isFavorite: false,
					createdAt: "2024-01-02T00:00:00Z",
					updatedAt: "2024-01-02T00:00:00Z",
					readAt: null,
				},
			];

			vi.mocked(apiClient.getUnreadBookmarks).mockResolvedValue(
				mockUnreadBookmarks,
			);

			const result = await apiClient.getUnreadBookmarks();

			expect(result).toEqual(mockUnreadBookmarks);
			expect(apiClient.getUnreadBookmarks).toHaveBeenCalledOnce();
		});

		it("未読のブックマークがない場合空配列を返す", async () => {
			vi.mocked(apiClient.getUnreadBookmarks).mockResolvedValue([]);

			const result = await apiClient.getUnreadBookmarks();

			expect(result).toEqual([]);
		});
	});

	describe("getReadBookmarks", () => {
		it("既読のブックマークリストを取得できる", async () => {
			const mockReadBookmarks = [
				{
					id: 3,
					url: "https://example.com/article3",
					title: "既読記事1",
					labels: ["database"],
					isRead: true,
					isFavorite: false,
					createdAt: "2024-01-01T00:00:00Z",
					readAt: "2024-01-10T00:00:00Z",
				},
			];

			vi.mocked(apiClient.getReadBookmarks).mockResolvedValue(
				mockReadBookmarks,
			);

			const result = await apiClient.getReadBookmarks();

			expect(result).toEqual(mockReadBookmarks);
			expect(apiClient.getReadBookmarks).toHaveBeenCalledOnce();
		});
	});

	describe("markBookmarkAsRead", () => {
		it("ブックマークを既読にマークできる", async () => {
			const mockResponse = {
				success: true as const,
				message: "Bookmark marked as read",
			};
			vi.mocked(apiClient.markBookmarkAsRead).mockResolvedValue(mockResponse);

			const result = await apiClient.markBookmarkAsRead(1);

			expect(result).toEqual(mockResponse);
			expect(apiClient.markBookmarkAsRead).toHaveBeenCalledWith(1);
		});
	});
});
