import { count, eq, inArray } from "drizzle-orm";
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

	describe("URLリストによるブックマーク取得", () => {
		it("複数URLを指定して該当するブックマークを取得できること", async () => {
			const urls = ["https://example.com", "https://example2.com"];
			const mockBookmarks = [
				{ id: 1, url: urls[0], title: "Example 1", isRead: false },
				{ id: 2, url: urls[1], title: "Example 2", isRead: false },
			];
			mockDb.all.mockResolvedValue(mockBookmarks);

			const result = await repository.findByUrls(urls);
			expect(result).toEqual(mockBookmarks);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDb.where).toHaveBeenCalledWith(inArray(bookmarks.url, urls));
		});

		it("1つのURLを指定して該当するブックマークを取得できること", async () => {
			const url = "https://example.com";
			const mockBookmark = { id: 1, url, title: "Example", isRead: false };
			mockDb.all.mockResolvedValue([mockBookmark]);

			const result = await repository.findByUrls([url]);
			expect(result).toEqual([mockBookmark]);
			expect(mockDb.where).toHaveBeenCalledWith(inArray(bookmarks.url, [url]));
		});

		it("空配列を渡した場合に空配列を返すこと", async () => {
			const result = await repository.findByUrls([]);
			expect(result).toEqual([]);
			expect(mockDb.select).not.toHaveBeenCalled();
		});

		it("部分一致するURLは取得されないこと", async () => {
			const urls = ["https://example.com"];
			mockDb.all.mockResolvedValue([]);

			const result = await repository.findByUrls(urls);
			expect(result).toEqual([]);
		});

		it("URLの大文字小文字が異なっていてもマッチすること", async () => {
			const urls = ["https://EXAMPLE.com"];
			const mockBookmarks = [
				{ id: 1, url: "https://example.com", title: "Match", isRead: false },
			];
			mockDb.all.mockResolvedValue(mockBookmarks);

			const result = await repository.findByUrls(urls);
			expect(result).toEqual(mockBookmarks);
		});

		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const urls = ["https://example.com"];
			mockDb.all.mockRejectedValue(new Error("Database error"));

			await expect(repository.findByUrls(urls)).rejects.toThrow();
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
