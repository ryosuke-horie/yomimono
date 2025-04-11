import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookmarkRepository } from "../../../src/repositories/bookmark";
import { DefaultBookmarkService } from "../../../src/services/bookmark";

describe("DefaultBookmarkService", () => {
	let service: DefaultBookmarkService;
	let mockRepository: BookmarkRepository;

	beforeEach(() => {
		mockRepository = {
			findByUrls: vi.fn().mockResolvedValue([]),
			findUnread: vi.fn(),
			createMany: vi.fn(),
			markAsRead: vi.fn(),
			countUnread: vi.fn(),
			countTodayRead: vi.fn(),
			addToFavorites: vi.fn(),
			removeFromFavorites: vi.fn(),
			getFavoriteBookmarks: vi.fn(),
			isFavorite: vi.fn(),
		};

		service = new DefaultBookmarkService(mockRepository);
	});

	describe("お気に入り機能", () => {
		describe("addToFavorites", () => {
			it("リポジトリを使用してお気に入りに追加できること", async () => {
				const bookmarkId = 1;
				mockRepository.addToFavorites = vi.fn().mockResolvedValue(undefined);

				await service.addToFavorites(bookmarkId);

				expect(mockRepository.addToFavorites).toHaveBeenCalledWith(bookmarkId);
			});

			it("エラーを適切に伝播すること", async () => {
				const bookmarkId = 1;
				const error = new Error("Already favorited");
				mockRepository.addToFavorites = vi.fn().mockRejectedValue(error);

				await expect(service.addToFavorites(bookmarkId)).rejects.toThrow(error);
			});

			it("エラーが Error インスタンスでない場合、デフォルトエラーメッセージを返すこと", async () => {
				const bookmarkId = 1;
				const error = "文字列エラー";
				mockRepository.addToFavorites = vi.fn().mockRejectedValue(error);

				await expect(service.addToFavorites(bookmarkId)).rejects.toThrow(
					"Failed to add to favorites",
				);
			});
		});

		describe("removeFromFavorites", () => {
			it("リポジトリを使用してお気に入りから削除できること", async () => {
				const bookmarkId = 1;
				mockRepository.removeFromFavorites = vi
					.fn()
					.mockResolvedValue(undefined);

				await service.removeFromFavorites(bookmarkId);

				expect(mockRepository.removeFromFavorites).toHaveBeenCalledWith(
					bookmarkId,
				);
			});

			it("エラーを適切に伝播すること", async () => {
				const bookmarkId = 1;
				const error = new Error("Favorite not found");
				mockRepository.removeFromFavorites = vi.fn().mockRejectedValue(error);

				await expect(service.removeFromFavorites(bookmarkId)).rejects.toThrow(
					error,
				);
			});

			it("エラーが Error インスタンスでない場合、デフォルトエラーメッセージを返すこと", async () => {
				const bookmarkId = 1;
				const error = "文字列エラー";
				mockRepository.removeFromFavorites = vi.fn().mockRejectedValue(error);

				await expect(service.removeFromFavorites(bookmarkId)).rejects.toThrow(
					"Failed to remove from favorites",
				);
			});
		});

		describe("getFavoriteBookmarks", () => {
			it("リポジトリからお気に入りブックマークを取得できること", async () => {
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

				const mockRepositoryResponse = {
					bookmarks: mockBookmarks,
					total: 1,
				};

				mockRepository.getFavoriteBookmarks = vi
					.fn()
					.mockResolvedValue(mockRepositoryResponse);

				const result = await service.getFavoriteBookmarks(1, 10);

				expect(mockRepository.getFavoriteBookmarks).toHaveBeenCalledWith(0, 10);
				expect(result).toEqual({
					bookmarks: mockBookmarks,
					pagination: {
						currentPage: 1,
						totalPages: 1,
						totalItems: 1,
					},
				});
			});

			it("エラーを適切に伝播すること", async () => {
				const error = new Error("Database error");
				mockRepository.getFavoriteBookmarks = vi.fn().mockRejectedValue(error);

				await expect(service.getFavoriteBookmarks()).rejects.toThrow(
					"Failed to get favorite bookmarks",
				);
			});
		});
	});

	describe("getTodayReadCount：当日の既読数の取得", () => {
		it("リポジトリから当日の既読数を取得できること", async () => {
			mockRepository.countTodayRead = vi.fn().mockResolvedValue(5);

			const result = await service.getTodayReadCount();

			expect(mockRepository.countTodayRead).toHaveBeenCalled();
			expect(result).toBe(5);
		});

		it("0件の場合も適切に処理すること", async () => {
			mockRepository.countTodayRead = vi.fn().mockResolvedValue(0);

			const result = await service.getTodayReadCount();

			expect(mockRepository.countTodayRead).toHaveBeenCalled();
			expect(result).toBe(0);
		});

		it("リポジトリからのエラーを伝播すること", async () => {
			const error = new Error("Repository error");
			mockRepository.countTodayRead = vi.fn().mockRejectedValue(error);

			await expect(service.getTodayReadCount()).rejects.toThrow(error);
		});
	});

	describe("getUnreadBookmarksCount：未読ブックマーク数の取得", () => {
		it("リポジトリから未読ブックマークの数を返す", async () => {
			mockRepository.countUnread = vi.fn().mockResolvedValue(5);

			const result = await service.getUnreadBookmarksCount();

			expect(mockRepository.countUnread).toHaveBeenCalled();
			expect(result).toBe(5);
		});

		it("0件の場合も適切に処理する", async () => {
			mockRepository.countUnread = vi.fn().mockResolvedValue(0);

			const result = await service.getUnreadBookmarksCount();

			expect(mockRepository.countUnread).toHaveBeenCalled();
			expect(result).toBe(0);
		});

		it("リポジトリからのエラーを伝播する", async () => {
			const error = new Error("Repository error");
			mockRepository.countUnread = vi.fn().mockRejectedValue(error);

			await expect(service.getUnreadBookmarksCount()).rejects.toThrow(error);
		});
	});

	describe("getUnreadBookmarks：未読ブックマークの取得", () => {
		it("リポジトリから未読ブックマークを返す", async () => {
			const mockBookmarks = [
				{ id: 1, title: "Test Bookmark" },
				{ id: 2, title: "Another Bookmark" },
			];
			mockRepository.findUnread = vi.fn().mockResolvedValue(mockBookmarks);

			const result = await service.getUnreadBookmarks();

			expect(mockRepository.findUnread).toHaveBeenCalled();
			expect(result).toEqual(mockBookmarks);
		});

		it("空の配列の場合も適切に処理する", async () => {
			mockRepository.findUnread = vi.fn().mockResolvedValue([]);

			const result = await service.getUnreadBookmarks();

			expect(mockRepository.findUnread).toHaveBeenCalled();
			expect(result).toEqual([]);
		});

		it("リポジトリからのエラーを伝播する", async () => {
			const error = new Error("Repository error");
			mockRepository.findUnread = vi.fn().mockRejectedValue(error);

			await expect(service.getUnreadBookmarks()).rejects.toThrow(error);
		});
	});

	describe("createBookmarksFromData：ブックマークの作成", () => {
		it("リポジトリを使用してブックマークを作成する", async () => {
			const bookmarksToCreate = [
				{ url: "https://example.com", title: "Example" },
				{ url: "https://test.com", title: "Test" },
			];

			// 既存のブックマークが無いことをモック
			mockRepository.findByUrls = vi.fn().mockResolvedValue([]);
			mockRepository.createMany = vi.fn().mockResolvedValue(undefined);

			await service.createBookmarksFromData(bookmarksToCreate);

			expect(mockRepository.createMany).toHaveBeenCalled();
		});

		// 空の配列の場合のテストを実装に合わせて修正
		it("空の配列の場合はcreateMany呼び出しをスキップする", async () => {
			await service.createBookmarksFromData([]);

			// 空配列の場合はcreateMany呼び出し無し
			expect(mockRepository.createMany).not.toHaveBeenCalled();
		});

		it("リポジトリからのエラーを伝播する", async () => {
			const error = new Error("Repository error");
			mockRepository.findByUrls = vi.fn().mockResolvedValue([]);
			mockRepository.createMany = vi.fn().mockRejectedValue(error);
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
			// markAsReadは成功時にtrueを返すように修正
			mockRepository.markAsRead = vi.fn().mockResolvedValue(true);

			await service.markBookmarkAsRead(bookmarkId);

			expect(mockRepository.markAsRead).toHaveBeenCalledWith(bookmarkId);
		});

		it("リポジトリからのエラーを伝播する", async () => {
			const error = new Error("Repository error");
			mockRepository.markAsRead = vi.fn().mockRejectedValue(error);
			const bookmarkId = 123;

			await expect(service.markBookmarkAsRead(bookmarkId)).rejects.toThrow(
				error,
			);
		});

		it("ブックマークが見つからない場合はエラーを投げる", async () => {
			const bookmarkId = 999;
			// markAsReadはブックマークが見つからない場合falseを返す
			mockRepository.markAsRead = vi.fn().mockResolvedValue(false);

			await expect(service.markBookmarkAsRead(bookmarkId)).rejects.toThrow(
				"Bookmark not found",
			);

			expect(mockRepository.markAsRead).toHaveBeenCalledWith(bookmarkId);
		});
	});
});
