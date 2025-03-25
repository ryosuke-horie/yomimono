import { count, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { bookmarks } from "../../../src/db/schema";
import { DrizzleBookmarkRepository } from "../../../src/repositories/bookmark";

describe("ブックマークリポジトリ", () => {
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

	describe("未読ブックマークの取得", () => {
		it("未読ブックマークを全て取得できること", async () => {
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

		it("DBクエリ失敗時にエラーをスローすること", async () => {
			// Setup
			const mockError = new Error("Database error");
			mockDb.all.mockRejectedValue(mockError);

			// Execute & Verify
			await expect(repository.findUnread()).rejects.toThrow();
		});
	});

	describe("既読マーク処理", () => {
		it("ブックマークを既読状態に更新できること", async () => {
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

		it("存在しないブックマークの場合falseを返すこと", async () => {
			// Setup
			const bookmarkId = 999;
			mockDb.get.mockResolvedValue(null);

			// Execute
			const result = await repository.markAsRead(bookmarkId);

			// Verify
			expect(result).toBe(false);
		});

		it("DB更新失敗時にエラーをスローすること", async () => {
			// Setup
			const bookmarkId = 1;
			const mockBookmark = { id: bookmarkId, isRead: false };
			mockDb.get.mockResolvedValue(mockBookmark);
			mockDb.run.mockRejectedValue(new Error("Database error"));

			// Execute & Verify
			await expect(repository.markAsRead(bookmarkId)).rejects.toThrow();
		});
	});

	describe("複数ブックマーク作成", () => {
		it("複数のブックマークを作成できること", async () => {
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

		it("空配列の場合早期リターンすること", async () => {
			// Setup
			const emptyArray: { url: string; title: string }[] = [];

			// Execute
			await repository.createMany(emptyArray);

			// Verify
			expect(mockDb.insert).not.toHaveBeenCalled();
		});

		it("DB挿入失敗時にエラーをスローすること", async () => {
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

	describe("未読ブックマーク数取得", () => {
		it("未読ブックマーク数を取得できること", async () => {
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

		it("結果がない場合0を返すこと", async () => {
			// Setup
			mockDb.get.mockResolvedValue(null);

			// Execute
			const result = await repository.countUnread();

			// Verify
			expect(result).toBe(0);
		});

		it("DBクエリ失敗時にエラーをスローすること", async () => {
			// Setup
			mockDb.get.mockRejectedValue(new Error("Database error"));

			// Execute & Verify
			await expect(repository.countUnread()).rejects.toThrow();
		});
	});
});
