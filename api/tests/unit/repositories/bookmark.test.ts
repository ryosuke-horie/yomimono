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
			run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
			get: vi.fn(),
			all: vi.fn(),
			delete: vi.fn().mockReturnThis(),
			innerJoin: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			offset: vi.fn().mockReturnThis(),
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
				{
					id: 1,
					url: "https://example.com",
					title: "Example",
					isRead: false,
					isFavorite: false,
				},
				{
					id: 2,
					url: "https://example2.com",
					title: "Example 2",
					isRead: false,
					isFavorite: false,
				},
			];
			mockDb.all.mockResolvedValue(mockBookmarks);
			// favoriteの検索結果は空配列を返す
			mockDb.all.mockImplementation((query) => {
				if (query?.includes("favorites")) {
					return Promise.resolve([]);
				}
				return Promise.resolve(mockBookmarks);
			});

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
				{
					id: 1,
					url: urls[0],
					title: "Example 1",
					isRead: false,
					isFavorite: false,
				},
				{
					id: 2,
					url: urls[1],
					title: "Example 2",
					isRead: false,
					isFavorite: false,
				},
			];
			mockDb.all.mockImplementation((query) => {
				if (query?.includes("favorites")) {
					return Promise.resolve([]);
				}
				return Promise.resolve(mockBookmarks);
			});

			const result = await repository.findByUrls(urls);
			expect(result).toEqual(mockBookmarks);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDb.where).toHaveBeenCalledWith(inArray(bookmarks.url, urls));
		});

		it("1つのURLを指定して該当するブックマークを取得できること", async () => {
			const url = "https://example.com";
			const mockBookmark = {
				id: 1,
				url,
				title: "Example",
				isRead: false,
				isFavorite: false,
			};
			mockDb.all.mockResolvedValue([mockBookmark]);
			// favoriteの検索結果は空配列を返す
			mockDb.all.mockImplementation((query) => {
				if (query?.includes("favorites")) {
					return Promise.resolve([]);
				}
				return Promise.resolve([mockBookmark]);
			});

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
				{
					id: 1,
					url: "https://example.com",
					title: "Match",
					isRead: false,
					isFavorite: false,
				},
			];
			mockDb.all.mockResolvedValue(mockBookmarks);
			// favoriteの検索結果は空配列を返す
			mockDb.all.mockImplementation((query) => {
				if (query?.includes("favorites")) {
					return Promise.resolve([]);
				}
				return Promise.resolve(mockBookmarks);
			});

			const result = await repository.findByUrls(urls);
			expect(result).toEqual(mockBookmarks);
		});

		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const urls = ["https://example.com"];
			mockDb.all.mockRejectedValue(new Error("Database error"));

			await expect(repository.findByUrls(urls)).rejects.toThrow();
		});
	});

	describe("お気に入り機能", () => {
		describe("addToFavorites", () => {
			it("お気に入りに追加できること", async () => {
				// Setup
				const bookmarkId = 1;
				mockDb.get.mockResolvedValueOnce({ id: bookmarkId }); // ブックマーク存在確認
				mockDb.get.mockResolvedValueOnce(null); // お気に入り重複確認
				mockDb.run.mockResolvedValue({ meta: { changes: 1 } });

				// Execute
				await repository.addToFavorites(bookmarkId);

				// Verify
				expect(mockDb.get).toHaveBeenCalledTimes(2);
				expect(mockDb.insert).toHaveBeenCalled();
			});

			it("存在しないブックマークの場合エラーを投げること", async () => {
				// Setup
				const bookmarkId = 999;
				mockDb.get.mockResolvedValue(null);

				// Execute & Verify
				await expect(repository.addToFavorites(bookmarkId)).rejects.toThrow(
					"Bookmark not found",
				);
			});

			it("既にお気に入り済みの場合エラーを投げること", async () => {
				// Setup
				const bookmarkId = 1;
				mockDb.get.mockResolvedValueOnce({ id: bookmarkId }); // ブックマーク存在確認
				mockDb.get.mockResolvedValueOnce({ id: 1 }); // お気に入り重複確認

				// Execute & Verify
				await expect(repository.addToFavorites(bookmarkId)).rejects.toThrow(
					"Already favorited",
				);
			});
		});

		describe("removeFromFavorites", () => {
			it("お気に入りから削除できること", async () => {
				// Setup
				const bookmarkId = 1;
				mockDb.run.mockResolvedValue({ meta: { changes: 1 } });

				// Execute
				await repository.removeFromFavorites(bookmarkId);

				// Verify
				expect(mockDb.delete).toHaveBeenCalled();
				expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
			});

			it("存在しないお気に入りの場合エラーを投げること", async () => {
				// Setup
				const bookmarkId = 999;
				mockDb.run.mockResolvedValue({ meta: { changes: 0 } });

				// Execute & Verify
				await expect(
					repository.removeFromFavorites(bookmarkId),
				).rejects.toThrow("Favorite not found");
			});
		});

		describe("getFavoriteBookmarks", () => {
			it("お気に入りブックマークを取得できること", async () => {
				// Setup
				const mockBookmarks = [
					{
						id: 1,
						url: "https://example.com",
						title: "Example",
						isRead: false,
						isFavorite: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				];
				const mockFavoriteResults = [{ bookmarks: mockBookmarks[0] }];
				mockDb.all.mockResolvedValue(mockFavoriteResults);
				mockDb.get.mockResolvedValue({ count: 1 });

				// Execute
				const result = await repository.getFavoriteBookmarks(0, 10);

				// Verify
				expect(result).toEqual({
					bookmarks: mockBookmarks,
					total: 1,
				});
				expect(mockDb.select).toHaveBeenCalled();
				expect(mockDb.from).toHaveBeenCalled();
				expect(mockDb.innerJoin).toHaveBeenCalled();
			});

			it("Promise.allでのエラーを適切に伝播すること", async () => {
				// Totalの取得でエラー
				mockDb.get.mockRejectedValue(new Error("Database error"));
				mockDb.select.mockImplementation(() => mockDb);
				mockDb.from.mockImplementation(() => mockDb);

				await expect(repository.getFavoriteBookmarks(0, 10)).rejects.toThrow(
					"Database error",
				);
			});

			it("お気に入りが無い場合は空配列を返すこと", async () => {
				// Setup
				mockDb.all.mockResolvedValue([]);
				mockDb.get.mockResolvedValue({ count: 0 });

				// Execute
				const result = await repository.getFavoriteBookmarks(0, 10);

				// Verify
				expect(result).toEqual({
					bookmarks: [],
					total: 0,
				});
			});
		});

		describe("isFavorite", () => {
			it("お気に入り状態を確認できること", async () => {
				// Setup
				const bookmarkId = 1;
				mockDb.get.mockResolvedValue({ id: 1 });

				// Execute
				const result = await repository.isFavorite(bookmarkId);

				// Verify
				expect(result).toBe(true);
				expect(mockDb.select).toHaveBeenCalled();
				expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
			});

			it("お気に入りでない場合はfalseを返すこと", async () => {
				// Setup
				const bookmarkId = 1;
				mockDb.get.mockResolvedValue(null);

				// Execute
				const result = await repository.isFavorite(bookmarkId);

				// Verify
				expect(result).toBe(false);
			});
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
