/**
 * 未評価ブックマーク取得機能のテスト
 * Service層のgetUnratedBookmarks()メソッドをテスト
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import type {
	BookmarkWithLabel,
	IBookmarkRepository,
} from "../../../src/interfaces/repository/bookmark";
import { DefaultBookmarkService } from "../../../src/services/bookmark";

describe("DefaultBookmarkService.getUnratedBookmarks", () => {
	let service: DefaultBookmarkService;
	let mockRepository: IBookmarkRepository;

	beforeEach(() => {
		// モックリポジトリの作成
		mockRepository = {
			findUnrated: vi.fn(),
			// 他のメソッドはテストで使用しないためvi.fn()で代替
			createMany: vi.fn(),
			findUnread: vi.fn(),
			findByUrls: vi.fn(),
			markAsRead: vi.fn(),
			markAsUnread: vi.fn(),
			countUnread: vi.fn(),
			countTodayRead: vi.fn(),
			addToFavorites: vi.fn(),
			removeFromFavorites: vi.fn(),
			getFavoriteBookmarks: vi.fn(),
			isFavorite: vi.fn(),
			findRecentlyRead: vi.fn(),
			findRead: vi.fn(),
			findUnlabeled: vi.fn(),
			findByLabelName: vi.fn(),
			findById: vi.fn(),
			findByIds: vi.fn(),
		};

		service = new DefaultBookmarkService(mockRepository);
	});

	test("リポジトリから未評価記事を取得して返す", async () => {
		// モックデータの準備
		const mockUnratedBookmarks: BookmarkWithLabel[] = [
			{
				id: 1,
				url: "https://example.com/unrated-1",
				title: "未評価記事1",
				isRead: false,
				isFavorite: false,
				label: null,
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-01"),
			},
			{
				id: 2,
				url: "https://example.com/unrated-2",
				title: "未評価記事2",
				isRead: true,
				isFavorite: true,
				label: {
					id: 1,
					name: "TypeScript",
					description: "TypeScript関連記事",
					createdAt: new Date("2024-01-01"),
					updatedAt: new Date("2024-01-01"),
				},
				createdAt: new Date("2024-01-02"),
				updatedAt: new Date("2024-01-02"),
			},
		];

		vi.mocked(mockRepository.findUnrated).mockResolvedValue(
			mockUnratedBookmarks,
		);

		// 実行
		const result = await service.getUnratedBookmarks();

		// 検証
		expect(mockRepository.findUnrated).toHaveBeenCalledOnce();
		expect(result).toEqual(mockUnratedBookmarks);
		expect(result).toHaveLength(2);
	});

	test("リポジトリから空配列が返されたらそのまま返す", async () => {
		// モックの設定
		vi.mocked(mockRepository.findUnrated).mockResolvedValue([]);

		// 実行
		const result = await service.getUnratedBookmarks();

		// 検証
		expect(mockRepository.findUnrated).toHaveBeenCalledOnce();
		expect(result).toEqual([]);
		expect(result).toHaveLength(0);
	});

	test("リポジトリでエラーが発生した場合はエラーメッセージ付きでthrowする", async () => {
		// モックの設定
		const mockError = new Error("Database connection failed");
		vi.mocked(mockRepository.findUnrated).mockRejectedValue(mockError);

		// 実行と検証
		await expect(service.getUnratedBookmarks()).rejects.toThrow(
			"Failed to get unrated bookmarks",
		);
		expect(mockRepository.findUnrated).toHaveBeenCalledOnce();
	});

	test("リポジトリで文字列エラーが発生した場合も適切にハンドルする", async () => {
		// モックの設定
		vi.mocked(mockRepository.findUnrated).mockRejectedValue("Database error");

		// 実行と検証
		await expect(service.getUnratedBookmarks()).rejects.toThrow(
			"Failed to get unrated bookmarks",
		);
		expect(mockRepository.findUnrated).toHaveBeenCalledOnce();
	});
});
