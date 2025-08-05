import { desc, eq, inArray } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	articleLabels,
	type Bookmark,
	bookmarks,
	favorites,
	type Label,
	labels,
} from "../../../src/db/schema";
import type { BookmarkWithLabel } from "../../../src/interfaces/repository/bookmark";
import { DrizzleBookmarkRepository } from "../../../src/repositories/bookmark";

const mockDbClient = {
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
	leftJoin: vi.fn().mockReturnThis(),
	limit: vi.fn().mockReturnThis(),
	offset: vi.fn().mockReturnThis(),
	orderBy: vi.fn().mockReturnThis(),
	update: vi.fn().mockReturnThis(),
	insert: vi.fn().mockReturnThis(),
	returning: vi.fn().mockReturnThis(),
	groupBy: vi.fn().mockReturnThis(),
};

vi.mock("drizzle-orm/d1", () => ({
	drizzle: vi.fn(() => mockDbClient),
}));

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
	const mockLabel1: Label = {
		id: 10,
		name: "typescript",
		description: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const mockLabel2: Label = {
		id: 11,
		name: "react",
		description: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockQueryResult1 = {
		bookmark: mockBookmark1,
		favorite: { id: 1, bookmarkId: 1, createdAt: new Date() },
		label: mockLabel1,
	};
	const mockQueryResult2 = {
		bookmark: mockBookmark2,
		favorite: null,
		label: mockLabel2,
	};
	const mockQueryResult3 = {
		bookmark: mockBookmark3,
		favorite: null,
		label: null,
	};

	const expectedResult1: BookmarkWithLabel = {
		...mockBookmark1,
		isFavorite: true,
		label: mockLabel1,
	};
	const expectedResult2: BookmarkWithLabel = {
		...mockBookmark2,
		isFavorite: false,
		label: mockLabel2,
	};
	const expectedResult3: BookmarkWithLabel = {
		...mockBookmark3,
		isFavorite: false,
		label: null,
	};

	beforeEach(() => {
		vi.clearAllMocks();

		// モックのリセット
		mockDbClient.select.mockReturnThis();
		mockDbClient.from.mockReturnThis();
		mockDbClient.where.mockReturnThis();
		mockDbClient.set.mockReturnThis();
		mockDbClient.values.mockReturnThis();
		mockDbClient.run.mockResolvedValue({ meta: { changes: 1 } });
		mockDbClient.delete.mockReturnThis();
		mockDbClient.innerJoin.mockReturnThis();
		mockDbClient.leftJoin.mockReturnThis();
		mockDbClient.orderBy.mockReturnThis();
		mockDbClient.update.mockReturnThis();
		mockDbClient.insert.mockReturnThis();

		repository = new DrizzleBookmarkRepository({} as D1Database);
	});

	describe("未読ブックマークの取得 (findUnread)", () => {
		it("未読ブックマークをラベル・お気に入り情報付きで全て取得できること", async () => {
			// 1回目のクエリ（ブックマーク + お気に入り）
			const bookmarksResult = [
				{
					bookmark: mockBookmark1,
					favorite: { id: 1, bookmarkId: 1, createdAt: new Date() },
				},
				{ bookmark: mockBookmark2, favorite: null },
			];
			// 2回目のクエリ（ラベル）
			const labelsResult = [
				{ articleId: 1, label: mockLabel1 },
				{ articleId: 2, label: mockLabel2 },
			];

			// より確実なモック設定: 呼び出し回数をカウントしてレスポンスを決定
			let callCount = 0;
			mockDbClient.all.mockImplementation(async () => {
				callCount++;
				if (callCount === 1) {
					return bookmarksResult;
				}
				if (callCount === 2) {
					return labelsResult;
				}
				return [];
			});

			const result = await repository.findUnread();
			expect(result).toEqual([expectedResult1, expectedResult2]);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.where).toHaveBeenCalledWith(
				eq(bookmarks.isRead, false),
			);
			expect(mockDbClient.all).toHaveBeenCalledTimes(2); // 2回のクエリ
		});

		it("未読ブックマークを作成日時の降順でソートして取得できること", async () => {
			// 1回目のクエリ（ブックマーク + お気に入り）- ソート済み
			const bookmarksResult = [
				{ bookmark: mockBookmark2, favorite: null },
				{
					bookmark: mockBookmark1,
					favorite: { id: 1, bookmarkId: 1, createdAt: new Date() },
				},
			];
			// 2回目のクエリ（ラベル）
			const labelsResult = [
				{ articleId: 1, label: mockLabel1 },
				{ articleId: 2, label: mockLabel2 },
			];

			// より確実なモック設定: 呼び出し回数をカウントしてレスポンスを決定
			let callCount = 0;
			mockDbClient.all.mockImplementation(async () => {
				callCount++;
				if (callCount === 1) {
					return bookmarksResult;
				}
				if (callCount === 2) {
					return labelsResult;
				}
				return [];
			});

			const result = await repository.findUnread();
			expect(result).toEqual([expectedResult2, expectedResult1]);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.where).toHaveBeenCalledWith(
				eq(bookmarks.isRead, false),
			);
			expect(mockDbClient.orderBy).toHaveBeenCalledWith(
				desc(bookmarks.createdAt),
			);
			expect(mockDbClient.all).toHaveBeenCalledTimes(2); // 2回のクエリ
		});

		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const mockError = new Error("Database error");
			mockDbClient.all.mockRejectedValue(mockError);
			await expect(repository.findUnread()).rejects.toThrow(mockError);
		});
	});

	describe("URLリストによるブックマーク取得 (findByUrls)", () => {
		it("複数URLを指定して該当するブックマークをラベル・お気に入り情報付きで取得できること", async () => {
			const urls = [mockBookmark1.url, mockBookmark2.url];
			mockDbClient.all.mockResolvedValue([mockQueryResult1, mockQueryResult2]);
			const result = await repository.findByUrls(urls);
			expect(result).toEqual([expectedResult1, expectedResult2]);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.where).toHaveBeenCalledWith(
				inArray(bookmarks.url, urls),
			);
			expect(mockDbClient.leftJoin).toHaveBeenCalledTimes(3);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});

		it("空配列を渡した場合に空配列を返すこと", async () => {
			const result = await repository.findByUrls([]);
			expect(result).toEqual([]);
			expect(mockDbClient.select).not.toHaveBeenCalled();
		});

		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const urls = [mockBookmark1.url];
			const mockError = new Error("Database error");
			mockDbClient.all.mockRejectedValue(mockError);
			await expect(repository.findByUrls(urls)).rejects.toThrow(mockError);
		});
	});

	describe("お気に入りブックマーク取得 (getFavoriteBookmarks)", () => {
		it("お気に入りブックマークをラベル情報付きで取得できること", async () => {
			mockDbClient.get.mockResolvedValue({ count: 1 });
			mockDbClient.all.mockResolvedValue([mockQueryResult1]);
			const result = await repository.getFavoriteBookmarks(0, 10);
			expect(result).toEqual({ bookmarks: [expectedResult1], total: 1 });
			expect(mockDbClient.select).toHaveBeenCalledTimes(3);
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.leftJoin).toHaveBeenCalledTimes(3);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
			expect(mockDbClient.get).toHaveBeenCalledOnce();
		});

		it("お気に入りが無い場合は空配列とtotal 0を返すこと", async () => {
			mockDbClient.get.mockResolvedValue({ count: 0 });
			mockDbClient.all.mockResolvedValue([]);
			const result = await repository.getFavoriteBookmarks(0, 10);
			expect(result).toEqual({ bookmarks: [], total: 0 });
		});

		it("DBクエリ失敗時にエラーをスローすること (count)", async () => {
			const mockError = new Error("Count error");
			mockDbClient.get.mockRejectedValue(mockError);
			await expect(repository.getFavoriteBookmarks(0, 10)).rejects.toThrow(
				mockError,
			);
		});

		it("DBクエリ失敗時にエラーをスローすること (main query)", async () => {
			const mockError = new Error("Main query error");
			mockDbClient.get.mockResolvedValue({ count: 1 });
			mockDbClient.all.mockRejectedValue(mockError);
			await expect(repository.getFavoriteBookmarks(0, 10)).rejects.toThrow(
				mockError,
			);
		});
	});

	describe("最近読んだブックマーク取得 (findRecentlyRead)", () => {
		it("最近読んだブックマークをラベル・お気に入り情報付きで取得できること", async () => {
			mockDbClient.all.mockResolvedValue([mockQueryResult3]);
			const result = await repository.findRecentlyRead();
			expect(result).toEqual([expectedResult3]);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.where).toHaveBeenCalledWith(expect.anything());
			expect(mockDbClient.orderBy).toHaveBeenCalledWith(
				desc(bookmarks.updatedAt),
			);
			expect(mockDbClient.leftJoin).toHaveBeenCalledTimes(3);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});

		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const mockError = new Error("Database error");
			mockDbClient.all.mockRejectedValue(mockError);
			await expect(repository.findRecentlyRead()).rejects.toThrow(mockError);
		});
	});

	describe("未ラベルブックマーク取得 (findUnlabeled)", () => {
		it("ラベルが付与されていないブックマークのみ取得できること", async () => {
			mockDbClient.all.mockResolvedValue([{ bookmarks: mockBookmark2 }]);
			const result = await repository.findUnlabeled();
			expect(result).toEqual([mockBookmark2]);
			expect(mockDbClient.select).toHaveBeenCalledWith({
				bookmarks: bookmarks,
			});
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.leftJoin).toHaveBeenCalledWith(
				articleLabels,
				expect.anything(),
			);

			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});

		it("未ラベルのブックマークが存在しない場合、空配列を返すこと", async () => {
			mockDbClient.all.mockResolvedValue([]);
			const result = await repository.findUnlabeled();
			expect(result).toEqual([]);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});

		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const mockError = new Error("Database error");
			mockDbClient.all.mockRejectedValue(mockError);
			await expect(repository.findUnlabeled()).rejects.toThrow(mockError);
		});
	});

	describe("ラベル名によるブックマーク取得 (findByLabelName)", () => {
		it("指定されたラベル名を持つブックマークをラベル・お気に入り情報付きで取得できること", async () => {
			const labelName = "typescript";
			mockDbClient.all.mockResolvedValue([
				{
					bookmark: mockBookmark1,
					favorite: { id: 1, bookmarkId: 1, createdAt: new Date() },
					label: mockLabel1,
				},
			]);
			const result = await repository.findByLabelName(labelName);
			expect(result).toEqual([expectedResult1]);
			expect(mockDbClient.select).toHaveBeenCalledWith({
				bookmark: bookmarks,
				favorite: favorites,
				label: labels,
			});
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.innerJoin).toHaveBeenCalledWith(
				articleLabels,
				expect.anything(),
			);
			expect(mockDbClient.innerJoin).toHaveBeenCalledWith(
				labels,
				expect.anything(),
			);
			expect(mockDbClient.leftJoin).toHaveBeenCalledWith(
				favorites,
				expect.anything(),
			); // Only one leftJoin here
			expect(mockDbClient.where).toHaveBeenCalledWith(
				expect.anything(), // andを使用した複数条件に対応
			);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});

		it("指定されたラベル名のブックマークが存在しない場合、空配列を返すこと", async () => {
			const labelName = "nonexistent";
			mockDbClient.all.mockResolvedValue([]);
			const result = await repository.findByLabelName(labelName);
			expect(result).toEqual([]);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});

		it("ラベル名によるブックマークを作成日時の降順でソートして取得できること", async () => {
			const labelName = "typescript";
			mockDbClient.all.mockResolvedValue([
				{
					bookmark: mockBookmark2,
					favorite: null,
					label: mockLabel1,
				},
				{
					bookmark: mockBookmark1,
					favorite: { id: 1, bookmarkId: 1, createdAt: new Date() },
					label: mockLabel1,
				},
			]);
			const result = await repository.findByLabelName(labelName);
			// 両方ともmockLabel1を使用するよう期待値を修正
			const expectedResultsWithLabel1 = [
				{ ...expectedResult2, label: mockLabel1 },
				{ ...expectedResult1, label: mockLabel1 },
			];
			expect(result).toEqual(expectedResultsWithLabel1);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.orderBy).toHaveBeenCalledWith(
				desc(bookmarks.createdAt),
			);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});

		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const labelName = "typescript";
			const mockError = new Error("Database error");
			mockDbClient.all.mockRejectedValue(mockError);
			await expect(repository.findByLabelName(labelName)).rejects.toThrow(
				mockError,
			);
		});
	});

	describe("IDによるブックマーク取得 (findById)", () => {
		it("指定されたIDのブックマークをラベル・お気に入り情報付きで取得できること", async () => {
			const bookmarkId = 2;
			mockDbClient.all.mockResolvedValue([mockQueryResult2]);
			const result = await repository.findById(bookmarkId);
			expect(result).toEqual(expectedResult2);
			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.where).toHaveBeenCalledWith(
				eq(bookmarks.id, bookmarkId),
			);
			expect(mockDbClient.leftJoin).toHaveBeenCalledTimes(3);
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});

		it("指定されたIDのブックマークが存在しない場合、undefinedを返すこと", async () => {
			const bookmarkId = 999;
			mockDbClient.all.mockResolvedValue([]);
			const result = await repository.findById(bookmarkId);
			expect(result).toBeUndefined();
			expect(mockDbClient.all).toHaveBeenCalledOnce();
		});

		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const bookmarkId = 1;
			const mockError = new Error("Database error");
			mockDbClient.all.mockRejectedValue(mockError);
			await expect(repository.findById(bookmarkId)).rejects.toThrow(mockError);
		});
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

		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const mockError = new Error("Database error");
			mockDbClient.get.mockRejectedValue(mockError);
			await expect(repository.countUnread()).rejects.toThrow(mockError);
		});

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

		it("DBクエリ失敗時にエラーをスローすること", async () => {
			const mockError = new Error("Database error");
			mockDbClient.get.mockRejectedValue(mockError);
			await expect(repository.countTodayRead()).rejects.toThrow(mockError);
		});

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

	describe("findUnrated", () => {
		it("記事評価機能削除後、全てのブックマークを未評価として返すこと", async () => {
			const mockResults = [
				{
					bookmark: mockBookmark1,
					favorite: null,
					label: null,
				},
				{
					bookmark: mockBookmark2,
					favorite: { id: 1, bookmarkId: 2, createdAt: new Date() },
					label: mockLabel1,
				},
			];

			mockDbClient.all.mockResolvedValue(mockResults);

			const result = await repository.findUnrated();

			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
			expect(mockDbClient.leftJoin).toHaveBeenCalledWith(
				favorites,
				eq(bookmarks.id, favorites.bookmarkId),
			);
			expect(mockDbClient.leftJoin).toHaveBeenCalledWith(
				articleLabels,
				eq(bookmarks.id, articleLabels.articleId),
			);
			expect(mockDbClient.leftJoin).toHaveBeenCalledWith(
				labels,
				eq(articleLabels.labelId, labels.id),
			);
			expect(mockDbClient.all).toHaveBeenCalled();

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				...mockBookmark1,
				isFavorite: false,
				label: null,
			});
			expect(result[1]).toEqual({
				...mockBookmark2,
				isFavorite: true,
				label: mockLabel1,
			});
		});

		it("空の結果を返すこと", async () => {
			mockDbClient.all.mockResolvedValue([]);

			const result = await repository.findUnrated();

			expect(result).toEqual([]);
		});

		it("DBエラー時にエラーをスローすること", async () => {
			const mockError = new Error("Database error");
			mockDbClient.all.mockRejectedValue(mockError);

			await expect(repository.findUnrated()).rejects.toThrow(mockError);

			expect(mockDbClient.select).toHaveBeenCalled();
			expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
		});
	});
});
