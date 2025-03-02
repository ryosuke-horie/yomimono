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
	it("should mark a bookmark as read", async () => {
	const bookmarkId = 1;
	
	mockD1Database.update.mockReturnValueOnce({
	set: vi.fn().mockReturnValue({
	where: vi.fn().mockReturnValue(Promise.resolve()),
	}),
	});
	
	await repository.markAsRead(bookmarkId);
	
	expect(mockD1Database.update).toHaveBeenCalled();
	});
	
	it("should handle database errors when marking as read", async () => {
	const bookmarkId = 1;
	const error = new Error("Database error");
	
	mockD1Database.update.mockReturnValueOnce({
	set: vi.fn().mockReturnValue({
	where: vi.fn().mockRejectedValue(error),
	}),
	});
	
	await expect(repository.markAsRead(bookmarkId)).rejects.toThrow("Database error");
	});
	});
	});
