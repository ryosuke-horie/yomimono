import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Bookmark, Label } from "../../../src/db/schema";
import type {
	BookmarkWithLabel,
	IBookmarkRepository,
} from "../../../src/interfaces/repository/bookmark";
import type { IBookmarkService } from "../../../src/interfaces/service/bookmark";
import { DefaultBookmarkService } from "../../../src/services/bookmark";

describe("DefaultBookmarkService", () => {
	let service: IBookmarkService;

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

	const mockFindByUrls = vi.fn();
	const mockFindUnread = vi.fn();
	const mockCreateMany = vi.fn();
	const mockMarkAsRead = vi.fn();
	const mockCountUnread = vi.fn();
	const mockCountTodayRead = vi.fn();
	const mockAddToFavorites = vi.fn();
	const mockRemoveFromFavorites = vi.fn();
	const mockGetFavoriteBookmarks = vi.fn();
	const mockIsFavorite = vi.fn();
	const mockFindRecentlyRead = vi.fn();
	const mockFindUnlabeled = vi.fn();
	const mockFindByLabelName = vi.fn();
	const mockFindById = vi.fn();

	const mockRepository: IBookmarkRepository = {
		findByUrls: mockFindByUrls,
		findUnread: mockFindUnread,
		createMany: mockCreateMany,
		markAsRead: mockMarkAsRead,
		markAsUnread: vi.fn(),
		countUnread: mockCountUnread,
		countTodayRead: mockCountTodayRead,
		addToFavorites: mockAddToFavorites,
		removeFromFavorites: mockRemoveFromFavorites,
		getFavoriteBookmarks: mockGetFavoriteBookmarks,
		isFavorite: mockIsFavorite,
		findRecentlyRead: mockFindRecentlyRead,
		findUnlabeled: mockFindUnlabeled,
		findByLabelName: mockFindByLabelName,
		findById: mockFindById,
		findRead: vi.fn(),
		findByIds: vi.fn(),
		findUnrated: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		service = new DefaultBookmarkService(mockRepository);
	});
	describe("お気に入り機能", () => {
		describe("addToFavorites", () => {
			it("リポジトリを使用してお気に入りに追加できること", async () => {
				const bookmarkId = 1;
				mockAddToFavorites.mockResolvedValue(undefined);

				await service.addToFavorites(bookmarkId);

				expect(mockAddToFavorites).toHaveBeenCalledWith(bookmarkId);
			});

			it("エラーを適切に伝播すること", async () => {
				const bookmarkId = 1;
				const error = new Error("Already favorited");
				mockAddToFavorites.mockRejectedValue(error);

				await expect(service.addToFavorites(bookmarkId)).rejects.toThrow(error);
			});

			it("エラーが Error インスタンスでない場合、デフォルトエラーメッセージを返すこと", async () => {
				const bookmarkId = 1;
				const error = "文字列エラー";
				mockAddToFavorites.mockRejectedValue(error);

				await expect(service.addToFavorites(bookmarkId)).rejects.toThrow(
					"Failed to add to favorites",
				);
			});
		});

		describe("removeFromFavorites", () => {
			it("リポジトリを使用してお気に入りから削除できること", async () => {
				const bookmarkId = 1;
				mockRemoveFromFavorites.mockResolvedValue(undefined);

				await service.removeFromFavorites(bookmarkId);

				expect(mockRemoveFromFavorites).toHaveBeenCalledWith(bookmarkId);
			});

			it("エラーを適切に伝播すること", async () => {
				const bookmarkId = 1;
				const error = new Error("Favorite not found");
				mockRemoveFromFavorites.mockRejectedValue(error);

				await expect(service.removeFromFavorites(bookmarkId)).rejects.toThrow(
					error,
				);
			});

			it("エラーが Error インスタンスでない場合、デフォルトエラーメッセージを返すこと", async () => {
				const bookmarkId = 1;
				const error = "文字列エラー";
				mockRemoveFromFavorites.mockRejectedValue(error);

				await expect(service.removeFromFavorites(bookmarkId)).rejects.toThrow(
					"Failed to remove from favorites",
				);
			});
		});

		describe("getFavoriteBookmarks", () => {
			it("リポジトリからお気に入りブックマークをラベル情報付きで取得できること", async () => {
				const mockBookmarks: BookmarkWithLabel[] = [expectedResult1];
				const mockRepositoryResponse = { bookmarks: mockBookmarks, total: 1 };
				mockGetFavoriteBookmarks.mockResolvedValue(mockRepositoryResponse);

				const result = await service.getFavoriteBookmarks();

				expect(mockGetFavoriteBookmarks).toHaveBeenCalledWith(0, 1000);
				expect(result).toEqual({
					bookmarks: mockBookmarks,
				});
			});

			it("エラーを適切に伝播すること", async () => {
				const error = new Error("Database error");
				mockGetFavoriteBookmarks.mockRejectedValue(error);

				await expect(service.getFavoriteBookmarks()).rejects.toThrow(
					"Failed to get favorite bookmarks",
				);
			});
		});
	});
	describe("getTodayReadCount：当日の既読数の取得", () => {
		it("リポジトリから当日の既読数を取得できること", async () => {
			mockCountTodayRead.mockResolvedValue(5);

			const result = await service.getTodayReadCount();

			expect(mockCountTodayRead).toHaveBeenCalled();
			expect(result).toBe(5);
		});

		it("0件の場合も適切に処理すること", async () => {
			mockCountTodayRead.mockResolvedValue(0);

			const result = await service.getTodayReadCount();

			expect(mockCountTodayRead).toHaveBeenCalled();
			expect(result).toBe(0);
		});

		it("リポジトリからのエラーを伝播すること", async () => {
			const error = new Error("Repository error");
			mockCountTodayRead.mockRejectedValue(error);

			await expect(service.getTodayReadCount()).rejects.toThrow(error);
		});
	});
	describe("getUnreadBookmarksCount：未読ブックマーク数の取得", () => {
		it("リポジトリから未読ブックマークの数を返す", async () => {
			mockCountUnread.mockResolvedValue(5);

			const result = await service.getUnreadBookmarksCount();

			expect(mockCountUnread).toHaveBeenCalled();
			expect(result).toBe(5);
		});

		it("0件の場合も適切に処理する", async () => {
			mockCountUnread.mockResolvedValue(0);

			const result = await service.getUnreadBookmarksCount();

			expect(mockCountUnread).toHaveBeenCalled();
			expect(result).toBe(0);
		});

		it("リポジトリからのエラーを伝播する", async () => {
			const error = new Error("Repository error");
			mockCountUnread.mockRejectedValue(error);

			await expect(service.getUnreadBookmarksCount()).rejects.toThrow(error);
		});
	});
	describe("getUnreadBookmarks：未読ブックマークの取得", () => {
		it("リポジトリから未読ブックマークをラベル情報付きで返す", async () => {
			const mockBookmarks: BookmarkWithLabel[] = [
				expectedResult1,
				expectedResult2,
			];
			mockFindUnread.mockResolvedValue(mockBookmarks);

			const result = await service.getUnreadBookmarks();

			expect(mockFindUnread).toHaveBeenCalled();
			expect(result).toEqual(mockBookmarks);
		});

		it("空の配列の場合も適切に処理する", async () => {
			mockFindUnread.mockResolvedValue([]);

			const result = await service.getUnreadBookmarks();

			expect(mockFindUnread).toHaveBeenCalled();
			expect(result).toEqual([]);
		});

		it("リポジトリからのエラーを伝播する", async () => {
			const error = new Error("Repository error");
			mockFindUnread.mockRejectedValue(error);

			await expect(service.getUnreadBookmarks()).rejects.toThrow(error);
		});
	});
	describe("createBookmarksFromData：ブックマークの作成", () => {
		it("リポジトリを使用してブックマークを作成する", async () => {
			const bookmarksToCreate = [
				{ url: "https://example.com", title: "Example" },
				{ url: "https://test.com", title: "Test" },
			];
			mockFindByUrls.mockResolvedValue([]);
			mockCreateMany.mockResolvedValue(undefined);

			await service.createBookmarksFromData(bookmarksToCreate);

			expect(mockFindByUrls).toHaveBeenCalledWith(
				bookmarksToCreate.map((b) => b.url),
			);
			expect(mockCreateMany).toHaveBeenCalled();
		});

		it("既存の未読ブックマークはスキップされること", async () => {
			const bookmarksToCreate = [
				{ url: mockBookmark1.url, title: "Existing Unread" },
				{ url: "https://new.com", title: "New" },
			];
			const existingUnread: BookmarkWithLabel = {
				...mockBookmark1,
				isFavorite: false,
				label: null,
			};
			mockFindByUrls.mockResolvedValue([existingUnread]);
			mockCreateMany.mockResolvedValue(undefined);

			await service.createBookmarksFromData(bookmarksToCreate);

			expect(mockCreateMany).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({ url: "https://new.com" }),
				]),
			);
			expect(mockCreateMany).not.toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({ url: mockBookmark1.url }),
				]),
			);
		});

		it("空の配列の場合はcreateMany呼び出しをスキップする", async () => {
			await service.createBookmarksFromData([]);
			expect(mockCreateMany).not.toHaveBeenCalled();
		});

		it("リポジトリからのエラーを伝播する", async () => {
			const error = new Error("Repository error");
			mockFindByUrls.mockResolvedValue([]);
			mockCreateMany.mockRejectedValue(error);
			const bookmarksToCreate = [
				{ url: "https://example.com", title: "Example" },
			];

			await expect(
				service.createBookmarksFromData(bookmarksToCreate),
			).rejects.toThrow(error);
		});
	});
	describe("markBookmarkAsRead：ブックマークを既読としてマーク", () => {
		it("リポジトリを使用してブックマークを既読としてマークする", async () => {
			const bookmarkId = 123;
			mockMarkAsRead.mockResolvedValue(true);

			await service.markBookmarkAsRead(bookmarkId);

			expect(mockMarkAsRead).toHaveBeenCalledWith(bookmarkId);
		});

		it("リポジトリからのエラーを伝播する", async () => {
			const error = new Error("Repository error");
			mockMarkAsRead.mockRejectedValue(error);
			const bookmarkId = 123;

			await expect(service.markBookmarkAsRead(bookmarkId)).rejects.toThrow(
				error,
			);
		});

		it("ブックマークが見つからない場合はエラーを投げる", async () => {
			const bookmarkId = 999;
			mockMarkAsRead.mockResolvedValue(false);

			await expect(service.markBookmarkAsRead(bookmarkId)).rejects.toThrow(
				"Bookmark not found",
			);
			expect(mockMarkAsRead).toHaveBeenCalledWith(bookmarkId);
		});
	});

	describe("getRecentlyReadBookmarks：最近読んだブックマークの取得", () => {
		it("リポジトリから最近読んだブックマークをラベル情報付きで日付ごとにグループ化して返す", async () => {
			const mockBookmarks: BookmarkWithLabel[] = [expectedResult1];
			mockFindRecentlyRead.mockResolvedValue(mockBookmarks);

			const result = await service.getRecentlyReadBookmarks();

			const date = new Date(expectedResult1.updatedAt);
			date.setHours(date.getHours() + 9);
			const dateStr = date.toISOString().split("T")[0];

			expect(mockFindRecentlyRead).toHaveBeenCalled();
			expect(result).toEqual({ [dateStr]: mockBookmarks });
		});

		it("リポジトリからのエラーを伝播する", async () => {
			const error = new Error("Repository error");
			mockFindRecentlyRead.mockRejectedValue(error);

			await expect(service.getRecentlyReadBookmarks()).rejects.toThrow(
				"Failed to get recently read bookmarks",
			);
		});
	});

	describe("getUnlabeledBookmarks：未ラベルブックマークの取得", () => {
		it("リポジトリから未ラベルブックマークを返す", async () => {
			const mockUnlabeled: Bookmark[] = [mockBookmark1];
			mockFindUnlabeled.mockResolvedValue(mockUnlabeled);

			const result = await service.getUnlabeledBookmarks();

			expect(mockFindUnlabeled).toHaveBeenCalled();
			expect(result).toEqual(mockUnlabeled);
		});

		it("リポジトリからのエラーを伝播する", async () => {
			const error = new Error("Repository error");
			mockFindUnlabeled.mockRejectedValue(error);

			await expect(service.getUnlabeledBookmarks()).rejects.toThrow(
				"Failed to get unlabeled bookmarks",
			);
		});
	});

	describe("getBookmarksByLabel：ラベルによるブックマーク取得", () => {
		it("リポジトリから指定されたラベルのブックマークをラベル情報付きで返す", async () => {
			const labelName = "typescript";
			const mockLabeled: BookmarkWithLabel[] = [expectedResult1];
			mockFindByLabelName.mockResolvedValue(mockLabeled);

			const result = await service.getBookmarksByLabel(labelName);

			expect(mockFindByLabelName).toHaveBeenCalledWith(labelName);
			expect(result).toEqual(mockLabeled);
		});

		it("リポジトリからのエラーを伝播する", async () => {
			const labelName = "typescript";
			const error = new Error("Repository error");
			mockFindByLabelName.mockRejectedValue(error);

			await expect(service.getBookmarksByLabel(labelName)).rejects.toThrow(
				"Failed to get bookmarks by label",
			);
		});
	});
});
