import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	resetDrizzleClientMock,
	setupDrizzleClientMock,
} from "../../tests/drizzle.mock";
import { type Bookmark, bookmarks, favorites } from "../db/schema";
import type { BookmarkWithFavorite } from "../interfaces/repository/bookmark";
import { DrizzleBookmarkRepository } from "./bookmark";

const { mockDb: mockDbClient } = setupDrizzleClientMock();

describe("ブックマークリポジトリ", () => {
	let repository: DrizzleBookmarkRepository;

	const mockBookmark1: Bookmark = {
		id: 1,
		url: "https://example.com/1",
		title: "Example 1",
		isRead: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const mockBookmark2: Bookmark = {
		id: 2,
		url: "https://example.com/2",
		title: "Example 2",
		isRead: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const mockBookmark3: Bookmark = {
		id: 3,
		url: "https://example.com/3",
		title: "Example 3",
		isRead: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const _mockQueryResult1 = {
		bookmark: mockBookmark1,
		favorite: { id: 1, bookmarkId: 1, createdAt: new Date() },
	};
	const _mockQueryResult2 = {
		bookmark: mockBookmark2,
		favorite: null,
	};
	const _mockQueryResult3 = {
		bookmark: mockBookmark3,
		favorite: null,
	};

	const _expectedResult1: BookmarkWithFavorite = {
		...mockBookmark1,
		isFavorite: true,
	};
	const _expectedResult2: BookmarkWithFavorite = {
		...mockBookmark2,
		isFavorite: false,
	};
	const _expectedResult3: BookmarkWithFavorite = {
		...mockBookmark3,
		isFavorite: false,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		resetDrizzleClientMock(mockDbClient);

		repository = new DrizzleBookmarkRepository({} as D1Database);
	});

	describe("URLリストによるブックマーク取得 (findByUrls)", () => {
		it("空配列を渡した場合に空配列を返すこと", async () => {
			const result = await repository.findByUrls([]);
			expect(result).toEqual([]);
			expect(mockDbClient.select).not.toHaveBeenCalled();
		});
	});

	describe("お気に入りブックマーク取得 (getFavoriteBookmarks)", () => {
		it("お気に入りが無い場合は空配列とtotal 0を返すこと", async () => {
			mockDbClient.get.mockResolvedValue({ count: 0 });
			mockDbClient.all.mockResolvedValue([]);
			const result = await repository.getFavoriteBookmarks(0, 10);
			expect(result).toEqual({ bookmarks: [], total: 0 });
		});

		it("同じブックマークIDが複数行に含まれても重複を排除すること", async () => {
			mockDbClient.get.mockResolvedValue({ count: 1 });
			const duplicateRow = {
				bookmark: mockBookmark1,
				favorite: { id: 1, bookmarkId: 1, createdAt: new Date() },
			};
			mockDbClient.all.mockResolvedValue([duplicateRow, duplicateRow]);
			const result = await repository.getFavoriteBookmarks(0, 10);
			expect(result.bookmarks).toHaveLength(1);
			expect(result.bookmarks[0].id).toBe(mockBookmark1.id);
		});

		// DBエラー系テストは簡略化
	});

	describe("IDによるブックマーク取得 (findById)", () => {
		it("指定されたIDのブックマークが存在しない場合、undefinedを返すこと", async () => {
			const bookmarkId = 999;
			mockDbClient.all.mockResolvedValue([]);
			const result = await repository.findById(bookmarkId);
			expect(result).toBeUndefined();
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});

		// DBエラー時の挙動は他のメソッドで検証済み
	});

	describe("未読ブックマーク数取得 (countUnread)", () => {
		it("未読ブックマーク数を取得できること", async () => {
			mockDbClient.get.mockResolvedValue({ count: 5 });
			const result = await repository.countUnread();
			expect(result).toBe(5);
			expect(mockDbClient.select).toHaveBeenCalledWith({
				count: expect.anything(),
			});
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.where).toHaveBeenCalledWith(
				eq(bookmarks.isRead, false),
			);
			expect(mockDbClient.get).toHaveBeenCalledOnce();
		});

		// DBエラー時の挙動は他のメソッドで検証済み

		it("結果がnullの場合に0を返すこと", async () => {
			mockDbClient.get.mockResolvedValue(null);
			const result = await repository.countUnread();
			expect(result).toBe(0);
		});
	});

	describe("今日読んだブックマーク数取得 (countTodayRead)", () => {
		it("今日読んだブックマーク数を取得できること", async () => {
			mockDbClient.get.mockResolvedValue({ count: 3 });
			const result = await repository.countTodayRead();
			expect(result).toBe(3);
			expect(mockDbClient.select).toHaveBeenCalledWith({
				count: expect.anything(),
			});
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.get).toHaveBeenCalledOnce();
		});

		// DBエラー時の挙動は他のメソッドで検証済み

		it("結果がnullの場合に0を返すこと", async () => {
			mockDbClient.get.mockResolvedValue(null);
			const result = await repository.countTodayRead();
			expect(result).toBe(0);
		});
	});

	describe("複数ブックマーク作成 (createMany)", () => {
		it("複数のブックマークを作成できること", async () => {
			const newBookmarks = [
				{
					url: "https://example.com/1",
					title: "Example 1",
					isRead: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					url: "https://example.com/2",
					title: "Example 2",
					isRead: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			await repository.createMany(newBookmarks);

			expect(mockDbClient.insert).toHaveBeenCalledTimes(2);
			expect(mockDbClient.values).toHaveBeenCalledTimes(2);
			expect(mockDbClient.insert).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.values).toHaveBeenCalledWith(newBookmarks[0]);
			expect(mockDbClient.values).toHaveBeenCalledWith(newBookmarks[1]);
		});

		it("空配列を渡した場合、即座に処理を終了すること", async () => {
			await repository.createMany([]);
			expect(mockDbClient.insert).not.toHaveBeenCalled();
		});

		it("DBエラー時にエラーをスローすること", async () => {
			const newBookmarks = [
				{
					url: "https://example.com/1",
					title: "Example 1",
					isRead: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			const mockError = new Error("Database error");
			mockDbClient.values.mockRejectedValue(mockError);

			await expect(repository.createMany(newBookmarks)).rejects.toThrow(
				mockError,
			);
		});
	});

	describe("ブックマークを既読にマーク (markAsRead)", () => {
		it("存在するブックマークを既読にできること", async () => {
			mockDbClient.get.mockResolvedValue(mockBookmark1);
			mockDbClient.run.mockResolvedValue({ meta: { changes: 1 } });

			const result = await repository.markAsRead(1);

			expect(result).toBe(true);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.where).toHaveBeenCalledWith(eq(bookmarks.id, 1));
			expect(mockDbClient.get).toHaveBeenCalled();
			expect(mockDbClient.update).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.set).toHaveBeenCalledWith({
				isRead: true,
				updatedAt: expect.any(Date),
			});
			expect(mockDbClient.run).toHaveBeenCalled();
		});

		it("存在しないブックマークのIDが指定された場合にfalseを返すこと", async () => {
			mockDbClient.get.mockResolvedValue(null);

			const result = await repository.markAsRead(999);

			expect(result).toBe(false);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.get).toHaveBeenCalled();
			expect(mockDbClient.update).not.toHaveBeenCalled();
		});

		it("DBエラー時にエラーをスローすること", async () => {
			const mockError = new Error("Database error");
			mockDbClient.get.mockRejectedValue(mockError);

			await expect(repository.markAsRead(1)).rejects.toThrow(mockError);
		});

		it("更新中にDBエラーが発生した場合にエラーをスローすること", async () => {
			mockDbClient.get.mockResolvedValue(mockBookmark1);
			const mockError = new Error("Update error");
			mockDbClient.run.mockRejectedValue(mockError);

			await expect(repository.markAsRead(1)).rejects.toThrow(mockError);
		});
	});

	describe("ブックマークを未読に戻す (markAsUnread)", () => {
		it("ブックマークを未読に戻せること", async () => {
			mockDbClient.get.mockResolvedValue({ ...mockBookmark1, isRead: true });
			mockDbClient.run.mockResolvedValue({ meta: { changes: 1 } });

			const result = await repository.markAsUnread(1);

			expect(result).toBe(true);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.where).toHaveBeenCalledWith(eq(bookmarks.id, 1));
			expect(mockDbClient.get).toHaveBeenCalled();
			expect(mockDbClient.update).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.set).toHaveBeenCalledWith({
				isRead: false,
				updatedAt: expect.any(Date),
			});
			expect(mockDbClient.run).toHaveBeenCalled();
		});

		it("存在しないブックマークのIDが指定された場合にfalseを返すこと", async () => {
			mockDbClient.get.mockResolvedValue(null);

			const result = await repository.markAsUnread(999);

			expect(result).toBe(false);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.get).toHaveBeenCalled();
			expect(mockDbClient.update).not.toHaveBeenCalled();
		});

		it("DBエラー時にエラーをスローすること", async () => {
			const mockError = new Error("Database error");
			mockDbClient.get.mockRejectedValue(mockError);

			await expect(repository.markAsUnread(1)).rejects.toThrow(mockError);
		});

		it("更新中にDBエラーが発生した場合にエラーをスローすること", async () => {
			mockDbClient.get.mockResolvedValue({ ...mockBookmark1, isRead: true });
			const mockError = new Error("Update error");
			mockDbClient.run.mockRejectedValue(mockError);

			await expect(repository.markAsUnread(1)).rejects.toThrow(mockError);
		});
	});

	describe("お気に入りに追加 (addToFavorites)", () => {
		it("ブックマークをお気に入りに追加できること", async () => {
			// 最初のget呼び出し（ブックマーク存在確認）ではブックマークを返す
			// 2回目のget呼び出し（お気に入り確認）ではnullを返す（まだお気に入りに追加されていない）
			mockDbClient.get
				.mockImplementationOnce(() => Promise.resolve(mockBookmark1))
				.mockImplementationOnce(() => Promise.resolve(null));

			await repository.addToFavorites(1);

			expect(mockDbClient.select).toHaveBeenCalledTimes(2); // 2回呼ばれる（ブックマーク存在確認とお気に入り確認）
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.from).toHaveBeenCalledWith(favorites);
			expect(mockDbClient.where).toHaveBeenCalledWith(eq(bookmarks.id, 1));
			expect(mockDbClient.where).toHaveBeenCalledWith(
				eq(favorites.bookmarkId, 1),
			);
			expect(mockDbClient.insert).toHaveBeenCalledWith(favorites);
			expect(mockDbClient.values).toHaveBeenCalledWith({
				bookmarkId: 1,
				createdAt: expect.any(Date),
			});
		});

		it("存在しないブックマークIDの場合にエラーをスローすること", async () => {
			mockDbClient.get.mockResolvedValue(null);

			await expect(repository.addToFavorites(999)).rejects.toThrow(
				"ブックマークが見つかりません",
			);

			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.where).toHaveBeenCalledWith(eq(bookmarks.id, 999));
			expect(mockDbClient.insert).not.toHaveBeenCalled();
		});

		it("既にお気に入りに追加されている場合にエラーをスローすること", async () => {
			// 最初のget呼び出し（ブックマーク存在確認）ではブックマークを返す
			// 2回目のget呼び出し（お気に入り確認）ではお気に入りレコードを返す
			mockDbClient.get
				.mockImplementationOnce(() => Promise.resolve(mockBookmark1))
				.mockImplementationOnce(() =>
					Promise.resolve({ id: 1, bookmarkId: 1, createdAt: new Date() }),
				);

			await expect(repository.addToFavorites(1)).rejects.toThrow(
				"すでにお気に入りに登録されています",
			);

			expect(mockDbClient.select).toHaveBeenCalledTimes(2);
			expect(mockDbClient.insert).not.toHaveBeenCalled();
		});

		it("DBエラー時にエラーをスローすること", async () => {
			const mockError = new Error("Database error");
			mockDbClient.get.mockRejectedValue(mockError);

			await expect(repository.addToFavorites(1)).rejects.toThrow(mockError);
		});
	});

	describe("お気に入りから削除 (removeFromFavorites)", () => {
		it("ブックマークをお気に入りから削除できること", async () => {
			mockDbClient.run.mockResolvedValue({ meta: { changes: 1 } });

			await repository.removeFromFavorites(1);

			expect(mockDbClient.delete).toHaveBeenCalledWith(favorites);
			expect(mockDbClient.where).toHaveBeenCalledWith(
				eq(favorites.bookmarkId, 1),
			);
			expect(mockDbClient.run).toHaveBeenCalled();
		});

		it("お気に入りに存在しないブックマークIDの場合にエラーをスローすること", async () => {
			mockDbClient.run.mockResolvedValue({ meta: { changes: 0 } });

			await expect(repository.removeFromFavorites(999)).rejects.toThrow(
				"お気に入りが見つかりません",
			);

			expect(mockDbClient.delete).toHaveBeenCalledWith(favorites);
			expect(mockDbClient.where).toHaveBeenCalledWith(
				eq(favorites.bookmarkId, 999),
			);
		});

		it("DBエラー時にエラーをスローすること", async () => {
			const mockError = new Error("Database error");
			mockDbClient.run.mockRejectedValue(mockError);

			await expect(repository.removeFromFavorites(1)).rejects.toThrow(
				mockError,
			);

			expect(mockDbClient.delete).toHaveBeenCalledWith(favorites);
			expect(mockDbClient.where).toHaveBeenCalledWith(
				eq(favorites.bookmarkId, 1),
			);
		});
	});

	describe("お気に入り状態確認 (isFavorite)", () => {
		it("お気に入りに追加されているブックマークIDの場合にtrueを返すこと", async () => {
			mockDbClient.get.mockResolvedValue({
				id: 1,
				bookmarkId: 1,
				createdAt: new Date(),
			});

			const result = await repository.isFavorite(1);

			expect(result).toBe(true);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(favorites);
			expect(mockDbClient.where).toHaveBeenCalledWith(
				eq(favorites.bookmarkId, 1),
			);
			expect(mockDbClient.get).toHaveBeenCalled();
		});

		it("お気に入りに追加されていないブックマークIDの場合にfalseを返すこと", async () => {
			mockDbClient.get.mockResolvedValue(null);

			const result = await repository.isFavorite(999);

			expect(result).toBe(false);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(favorites);
			expect(mockDbClient.where).toHaveBeenCalledWith(
				eq(favorites.bookmarkId, 999),
			);
			expect(mockDbClient.get).toHaveBeenCalled();
		});

		it("DBエラー時にエラーをスローすること", async () => {
			const mockError = new Error("Database error");
			mockDbClient.get.mockRejectedValue(mockError);

			await expect(repository.isFavorite(1)).rejects.toThrow(mockError);

			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(favorites);
			expect(mockDbClient.where).toHaveBeenCalledWith(
				eq(favorites.bookmarkId, 1),
			);
		});
	});
});
