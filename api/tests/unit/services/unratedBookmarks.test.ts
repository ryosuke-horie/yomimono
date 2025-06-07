/**
 * 未評価ブックマーク取得機能のサービス層テスト
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	BookmarkWithLabel,
	IBookmarkRepository,
} from "../../../src/interfaces/repository/bookmark";
import { DefaultBookmarkService } from "../../../src/services/bookmark";

// モックデータ
const mockUnratedBookmarks: BookmarkWithLabel[] = [
	{
		id: 1,
		url: "https://example.com/article1",
		title: "未評価の記事1",
		isRead: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		isFavorite: false,
		label: null,
	},
	{
		id: 2,
		url: "https://example.com/article2",
		title: "未評価の記事2",
		isRead: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		isFavorite: true,
		label: {
			id: 1,
			name: "JavaScript",
			createdAt: new Date(),
			updatedAt: new Date(),
			description: null,
		},
	},
];

// モックリポジトリ
const mockRepository = {
	findUnrated: vi.fn(),
	findByUrls: vi.fn(),
	countUnread: vi.fn(),
	countTodayRead: vi.fn(),
	findUnread: vi.fn(),
	createMany: vi.fn(),
	markAsRead: vi.fn(),
	markAsUnread: vi.fn(),
	addToFavorites: vi.fn(),
	removeFromFavorites: vi.fn(),
	getFavoriteBookmarks: vi.fn(),
	isFavorite: vi.fn(),
	findRecentlyRead: vi.fn(),
	findUnlabeled: vi.fn(),
	findRead: vi.fn(),
	findByLabelName: vi.fn(),
	findById: vi.fn(),
	findByIds: vi.fn(),
};

describe("DefaultBookmarkService - getUnratedBookmarks", () => {
	let service: DefaultBookmarkService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new DefaultBookmarkService(mockRepository as IBookmarkRepository);
	});

	it("未評価のブックマークを取得して返す", async () => {
		// リポジトリのモック設定
		mockRepository.findUnrated.mockResolvedValue(mockUnratedBookmarks);

		// サービスメソッドを実行
		const result = await service.getUnratedBookmarks();

		// 検証
		expect(mockRepository.findUnrated).toHaveBeenCalledTimes(1);
		expect(result).toEqual(mockUnratedBookmarks);
		expect(result).toHaveLength(2);
	});

	it("空の配列を返す場合も正常に処理する", async () => {
		// リポジトリのモック設定
		mockRepository.findUnrated.mockResolvedValue([]);

		// サービスメソッドを実行
		const result = await service.getUnratedBookmarks();

		// 検証
		expect(mockRepository.findUnrated).toHaveBeenCalledTimes(1);
		expect(result).toEqual([]);
	});

	it("リポジトリがエラーを投げた場合、適切なエラーメッセージで再スローする", async () => {
		// リポジトリのモック設定
		const originalError = new Error("Database connection failed");
		mockRepository.findUnrated.mockRejectedValue(originalError);

		// 検証
		await expect(service.getUnratedBookmarks()).rejects.toThrow(
			"Failed to get unrated bookmarks",
		);
		expect(mockRepository.findUnrated).toHaveBeenCalledTimes(1);
	});

	it("リポジトリが非Errorオブジェクトを投げた場合も適切に処理する", async () => {
		// リポジトリのモック設定
		mockRepository.findUnrated.mockRejectedValue("Unexpected error");

		// 検証
		await expect(service.getUnratedBookmarks()).rejects.toThrow(
			"Failed to get unrated bookmarks",
		);
		expect(mockRepository.findUnrated).toHaveBeenCalledTimes(1);
	});
});
