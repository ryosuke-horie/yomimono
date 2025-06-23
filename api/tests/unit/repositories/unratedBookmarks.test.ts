import { isNull } from "drizzle-orm";
/**
 * 未評価ブックマーク取得機能のリポジトリ層テスト
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	articleRatings,
	type Bookmark,
	bookmarks,
	favorites,
	type Label,
	labels,
} from "../../../src/db/schema";
import { DrizzleBookmarkRepository } from "../../../src/repositories/bookmark";

const mockDbClient = {
	select: vi.fn().mockReturnThis(),
	from: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	leftJoin: vi.fn().mockReturnThis(),
	all: vi.fn(),
};

vi.mock("drizzle-orm/d1", () => ({
	drizzle: vi.fn(() => mockDbClient),
}));

describe("BookmarkRepository - findUnrated", () => {
	let repository: DrizzleBookmarkRepository;

	beforeEach(() => {
		vi.clearAllMocks();
		repository = new DrizzleBookmarkRepository({} as D1Database);
	});

	it("評価されていないブックマークのみを取得する", async () => {
		// モックデータの準備
		const mockBookmark1: Bookmark = {
			id: 1,
			url: "https://example.com/article1",
			title: "未評価の記事1",
			isRead: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockBookmark2: Bookmark = {
			id: 2,
			url: "https://example.com/article2",
			title: "未評価の記事2",
			isRead: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockResults = [
			{
				bookmark: mockBookmark1,
				favorite: null,
				label: null,
			},
			{
				bookmark: mockBookmark2,
				favorite: null,
				label: null,
			},
		];

		mockDbClient.all.mockResolvedValue(mockResults);

		// 未評価のブックマークを取得
		const unratedBookmarks = await repository.findUnrated();

		// 検証
		expect(mockDbClient.select).toHaveBeenCalledWith({
			bookmark: bookmarks,
			favorite: favorites,
			label: labels,
		});
		expect(mockDbClient.from).toHaveBeenCalledWith(bookmarks);
		expect(mockDbClient.leftJoin).toHaveBeenCalledTimes(4);
		expect(mockDbClient.where).toHaveBeenCalledWith(isNull(articleRatings.id));

		expect(unratedBookmarks).toHaveLength(2);
		expect(unratedBookmarks[0]).toMatchObject({
			id: 1,
			title: "未評価の記事1",
			isFavorite: false,
			label: null,
		});
		expect(unratedBookmarks[1]).toMatchObject({
			id: 2,
			title: "未評価の記事2",
			isFavorite: false,
			label: null,
		});
	});

	it("お気に入りステータスとラベル情報を含む未評価ブックマークを返す", async () => {
		// モックデータの準備
		const mockBookmark: Bookmark = {
			id: 1,
			url: "https://example.com/article1",
			title: "未評価でお気に入りの記事",
			isRead: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockLabel: Label = {
			id: 1,
			name: "JavaScript",
			createdAt: new Date(),
			updatedAt: new Date(),
			description: null,
		};

		const mockResults = [
			{
				bookmark: mockBookmark,
				favorite: {
					id: 1,
					bookmarkId: 1,
					createdAt: new Date(),
				},
				label: mockLabel,
			},
		];

		mockDbClient.all.mockResolvedValue(mockResults);

		// 未評価のブックマークを取得
		const unratedBookmarks = await repository.findUnrated();

		// 検証
		expect(unratedBookmarks).toHaveLength(1);
		const bookmark = unratedBookmarks[0];
		expect(bookmark.id).toBe(1);
		expect(bookmark.isFavorite).toBe(true);
		expect(bookmark.label).toEqual(mockLabel);
	});

	it("評価済みのブックマークは除外される", async () => {
		// 評価済みのブックマークが返されない（空配列）
		mockDbClient.all.mockResolvedValue([]);

		// 未評価のブックマークを取得
		const unratedBookmarks = await repository.findUnrated();

		// 検証 - 評価済みのブックマークは含まれない
		expect(unratedBookmarks).toHaveLength(0);
	});

	it("ブックマークが存在しない場合は空配列を返す", async () => {
		// 空の結果を返す
		mockDbClient.all.mockResolvedValue([]);

		// 未評価のブックマークを取得
		const unratedBookmarks = await repository.findUnrated();

		// 検証
		expect(unratedBookmarks).toEqual([]);
	});

	it("エラーが発生した場合は例外を再スローする", async () => {
		// エラーをシミュレート
		const mockError = new Error("Database error");
		mockDbClient.all.mockRejectedValue(mockError);

		// 検証
		await expect(repository.findUnrated()).rejects.toThrow("Database error");
	});
});
