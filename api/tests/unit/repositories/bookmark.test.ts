import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { bookmarks } from "../../../src/db/schema";
import { DrizzleBookmarkRepository } from "../../../src/repositories/bookmark";

describe("DrizzleBookmarkRepository", () => {
	let repository: DrizzleBookmarkRepository;
	let mockDb: Record<string, jest.Mock>;

	beforeEach(() => {
		mockDb = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			all: vi.fn(),
			get: vi.fn(),
			insert: vi.fn().mockReturnThis(),
			values: vi.fn().mockResolvedValue({}),
			update: vi.fn().mockReturnThis(),
			set: vi.fn().mockReturnThis(),
			run: vi.fn().mockResolvedValue({}),
		};

		repository = new DrizzleBookmarkRepository(
			mockDb as unknown as DrizzleD1Database,
		);
	});

	describe("countUnread", () => {
		it("should return the number of unread bookmarks", async () => {
			mockDb.get.mockResolvedValue({ count: 5 });

			const result = await repository.countUnread();

			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDb.where).toHaveBeenCalledWith(eq(bookmarks.isRead, false));
			expect(result).toBe(5);
		});

		it("should return 0 when no unread bookmarks are found", async () => {
			mockDb.get.mockResolvedValue(null);

			const result = await repository.countUnread();

			expect(result).toBe(0);
		});

		it("should throw an error when database query fails", async () => {
			mockDb.get.mockRejectedValue(new Error("Database error"));

			await expect(repository.countUnread()).rejects.toThrow("Database error");
		});
	});
});
