import { count, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { bookmarks } from "../../../src/db/schema";
import { DrizzleBookmarkRepository } from "../../../src/repositories/bookmark";

describe("BookmarkRepository", () => {
	// モックDBオブジェクトを作成する関数
	const createMockDb = () => {
		// クエリビルダーチェーン用のベースモック
		const queryBuilder = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			set: vi.fn().mockReturnThis(),
			values: vi.fn().mockReturnThis(),
			run: vi.fn().mockResolvedValue({ changes: 1 }),
			get: vi.fn(),
			all: vi.fn(),
		};

		// メインのDBモック
		return {
			...queryBuilder,
			select: vi.fn(() => queryBuilder),
			update: vi.fn(() => queryBuilder),
			insert: vi.fn(() => queryBuilder),
		};
	};

	let mockDb: ReturnType<typeof createMockDb>;
	let repository: DrizzleBookmarkRepository;

	beforeEach(() => {
		mockDb = createMockDb();
		// @ts-expect-error: mockDbはDrizzleD1Databaseの部分的な実装
		repository = new DrizzleBookmarkRepository(mockDb);
		vi.clearAllMocks();
	});

	describe("findUnread", () => {
		it("should find all unread bookmarks", async () => {
			// Setup
			const mockBookmarks = [
				{ id: 1, url: "https://example.com", title: "Example", isRead: false },
				{
					id: 2,
					url: "https://example2.com",
					title: "Example 2",
					isRead: false,
				},
			];
			mockDb.all.mockResolvedValue(mockBookmarks);

			// Execute
			const result = await repository.findUnread();

			// Verify
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDb.where).toHaveBeenCalledWith(eq(bookmarks.isRead, false));
			expect(result).toEqual(mockBookmarks);
		});

		it("should throw an error when db query fails", async () => {
			// Setup
			const mockError = new Error("Database error");
			mockDb.all.mockRejectedValue(mockError);

			// Execute & Verify
			await expect(repository.findUnread()).rejects.toThrow();
		});
	});

	describe("markAsRead", () => {
		it("should mark a bookmark as read", async () => {
			// Setup
			const bookmarkId = 1;
			const mockBookmark = { id: bookmarkId, isRead: false };
			mockDb.get.mockResolvedValue(mockBookmark);

			// Execute
			const result = await repository.markAsRead(bookmarkId);

			// Verify
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDb.where).toHaveBeenCalledWith(eq(bookmarks.id, bookmarkId));
			expect(mockDb.update).toHaveBeenCalledWith(bookmarks);
			expect(mockDb.set).toHaveBeenCalledWith({
				isRead: true,
				updatedAt: expect.any(Date),
			});
			expect(result).toBe(true);
		});

		it("should return false when bookmark does not exist", async () => {
			// Setup
			const bookmarkId = 999;
			mockDb.get.mockResolvedValue(null);

			// Execute
			const result = await repository.markAsRead(bookmarkId);

			// Verify
			expect(result).toBe(false);
		});

		it("should throw an error when db update fails", async () => {
			// Setup
			const bookmarkId = 1;
			const mockBookmark = { id: bookmarkId, isRead: false };
			mockDb.get.mockResolvedValue(mockBookmark);
			mockDb.run.mockRejectedValue(new Error("Database error"));

			// Execute & Verify
			await expect(repository.markAsRead(bookmarkId)).rejects.toThrow();
		});
	});

	describe("createMany", () => {
		it("should create multiple bookmarks", async () => {
			// Setup
			const newBookmarks = [
				{ url: "https://example.com", title: "Example" },
				{ url: "https://example2.com", title: "Example 2" },
			];

			// モックのPromise.all（これはテスト環境では実際には必要ないですが、実装の安全のため）
			const originalPromiseAll = Promise.all;
			Promise.all = vi.fn().mockResolvedValue([]);

			// Execute
			await repository.createMany(newBookmarks);

			// Verify
			expect(mockDb.insert).toHaveBeenCalledWith(bookmarks);
			expect(mockDb.values).toHaveBeenCalled();
			expect(Promise.all).toHaveBeenCalled();

			// Cleanup
			Promise.all = originalPromiseAll;
		});

		it("should handle empty array early return", async () => {
			// Setup
			const emptyArray: { url: string; title: string }[] = [];

			// Execute
			await repository.createMany(emptyArray);

			// Verify
			expect(mockDb.insert).not.toHaveBeenCalled();
		});

		it("should throw an error when db insertion fails", async () => {
			// Setup
			const newBookmarks = [{ url: "https://example.com", title: "Example" }];

			// Promiseのスパイを設定して、エラーをスローさせる
			const originalPromiseAll = Promise.all;
			Promise.all = vi.fn().mockRejectedValue(new Error("Database error"));

			// Execute & Verify
			await expect(repository.createMany(newBookmarks)).rejects.toThrow();

			// Cleanup
			Promise.all = originalPromiseAll;
		});
	});

	describe("countUnread", () => {
		it("should count unread bookmarks", async () => {
			// Setup
			mockDb.get.mockResolvedValue({ count: 5 });

			// Execute
			const result = await repository.countUnread();

			// Verify
			expect(mockDb.select).toHaveBeenCalledWith({ count: count() });
			expect(mockDb.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDb.where).toHaveBeenCalledWith(eq(bookmarks.isRead, false));
			expect(result).toBe(5);
		});

		it("should return 0 when no result is found", async () => {
			// Setup
			mockDb.get.mockResolvedValue(null);

			// Execute
			const result = await repository.countUnread();

			// Verify
			expect(result).toBe(0);
		});

		it("should throw an error when db query fails", async () => {
			// Setup
			mockDb.get.mockRejectedValue(new Error("Database error"));

			// Execute & Verify
			await expect(repository.countUnread()).rejects.toThrow();
		});
	});
});
