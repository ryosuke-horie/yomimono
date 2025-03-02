import type { DrizzleD1Database } from "drizzle-orm/d1";
import { describe, expect, it, vi } from "vitest";
import { DrizzleBookmarkRepository } from "../../../src/repositories/bookmark";
import type { BookmarkRepository } from "../../../src/repositories/bookmark";
import { mockD1Database } from "../../test-utils";

describe("DrizzleBookmarkRepository", () => {
	const repository: BookmarkRepository = new DrizzleBookmarkRepository(
		mockD1Database as unknown as DrizzleD1Database,
	);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findUnread", () => {
		it("should return unread bookmarks", async () => {
			const expectedBookmarks = [
				{
					id: 1,
					url: "https://example.com",
					title: "Example",
					isRead: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockD1Database.select.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						all: vi.fn().mockResolvedValue(expectedBookmarks),
					}),
				}),
			});

			const result = await repository.findUnread();

			expect(result).toEqual(expectedBookmarks);
			expect(mockD1Database.select).toHaveBeenCalled();
		});

		it("should handle database errors", async () => {
			const error = new Error("Database error");
			mockD1Database.select.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						all: vi.fn().mockRejectedValue(error),
					}),
				}),
			});

			await expect(repository.findUnread()).rejects.toThrow("Database error");
		});
	});

	describe("createMany", () => {
		it("should insert multiple bookmarks successfully", async () => {
			const newBookmarks = [
				{
					url: "https://example.com",
					title: "Example",
					isRead: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					url: "https://example.org",
					title: "Example 2",
					isRead: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			await repository.createMany(newBookmarks);

			expect(mockD1Database.insert).toHaveBeenCalledTimes(2);
			expect(mockD1Database.insert).toHaveBeenCalled();
		});

		it("should handle empty array", async () => {
			await repository.createMany([]);
			expect(mockD1Database.insert).not.toHaveBeenCalled();
		});

		it("should throw error when database operation fails", async () => {
			const error = new Error("Database error");
			mockD1Database.insert.mockReturnValueOnce({
				values: vi.fn().mockRejectedValueOnce(error),
			});

			await expect(
				repository.createMany([
					{
						url: "https://example.com",
						title: "Example",
						isRead: false,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				]),
			).rejects.toThrow("Database error");
		});
	});

	describe("markAsRead", () => {
		it("should mark a bookmark as read when it exists", async () => {
			const bookmarkId = 1;
			const bookmark = {
				id: bookmarkId,
				url: "https://example.com",
				title: "Example",
				isRead: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// 存在確認のモック
			mockD1Database.select.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						get: vi.fn().mockResolvedValue(bookmark),
					}),
				}),
			});

			// 更新処理のモック
			mockD1Database.update.mockReturnValueOnce({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						run: vi.fn().mockResolvedValue(undefined),
					}),
				}),
			});

			const result = await repository.markAsRead(bookmarkId);

			expect(result).toBe(true);
			expect(mockD1Database.select).toHaveBeenCalled();
			expect(mockD1Database.update).toHaveBeenCalled();
		});

		it("should return false when bookmark does not exist", async () => {
			const bookmarkId = 999;

			// 存在確認のモック（存在しない場合）
			mockD1Database.select.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						get: vi.fn().mockResolvedValue(null),
					}),
				}),
			});

			const result = await repository.markAsRead(bookmarkId);

			expect(result).toBe(false);
			expect(mockD1Database.select).toHaveBeenCalled();
			expect(mockD1Database.update).not.toHaveBeenCalled();
		});

		it("should handle database errors", async () => {
			const bookmarkId = 1;
			const error = new Error("Database error");

			// 存在確認でエラーが発生するケース
			mockD1Database.select.mockReturnValueOnce({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						get: vi.fn().mockRejectedValue(error),
					}),
				}),
			});

			await expect(repository.markAsRead(bookmarkId)).rejects.toThrow(
				"Database error",
			);
		});
	});
});
