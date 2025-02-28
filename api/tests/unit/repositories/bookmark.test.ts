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
});
