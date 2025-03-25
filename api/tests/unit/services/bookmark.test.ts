import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookmarkRepository } from "../../../src/repositories/bookmark";
import { DefaultBookmarkService } from "../../../src/services/bookmark";

describe("DefaultBookmarkService", () => {
	let service: DefaultBookmarkService;
	let mockRepository: BookmarkRepository;

	beforeEach(() => {
		mockRepository = {
            findByUrls: vi.fn(),
			findUnread: vi.fn(),
			createMany: vi.fn(),
			markAsRead: vi.fn(),
			countUnread: vi.fn(),
		};

		service = new DefaultBookmarkService(mockRepository);
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
			mockRepository.createMany = vi.fn().mockResolvedValue(undefined);

			await service.createBookmarksFromData(bookmarksToCreate);

			expect(mockRepository.createMany).toHaveBeenCalled();
		});

		it("空の配列の場合も適切に処理する", async () => {
			await service.createBookmarksFromData([]);

			expect(mockRepository.createMany).toHaveBeenCalled();
		});

		it("リポジトリからのエラーを伝播する", async () => {
			const error = new Error("Repository error");
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
