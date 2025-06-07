/**
 * 未評価ブックマーク取得機能のテスト
 * Repository層のfindUnrated()メソッドをテスト
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import { DrizzleBookmarkRepository } from "../../../src/repositories/bookmark";

const mockDbClient = {
	select: vi.fn().mockReturnThis(),
	from: vi.fn().mockReturnThis(),
	leftJoin: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	all: vi.fn(),
	get: vi.fn(),
	set: vi.fn().mockReturnThis(),
	values: vi.fn().mockReturnThis(),
	run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
	delete: vi.fn().mockReturnThis(),
	innerJoin: vi.fn().mockReturnThis(),
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

describe("DrizzleBookmarkRepository.findUnrated", () => {
	let repository: DrizzleBookmarkRepository;

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

	test("評価がない記事を正確に取得する", async () => {
		// モックデータの準備
		const mockResult = [
			{
				bookmark: {
					id: 1,
					url: "https://example.com/unrated-article",
					title: "未評価記事",
					isRead: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				favorite: null,
				label: null,
			},
		];

		mockDbClient.all.mockResolvedValue(mockResult);

		// 実行
		const result = await repository.findUnrated();

		// 検証
		expect(mockDbClient.select).toHaveBeenCalled();
		expect(mockDbClient.from).toHaveBeenCalled();
		expect(mockDbClient.leftJoin).toHaveBeenCalledTimes(4); // favorites, articleLabels, labels, articleRatings
		expect(mockDbClient.where).toHaveBeenCalled();
		expect(mockDbClient.all).toHaveBeenCalled();

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(1);
		expect(result[0].url).toBe("https://example.com/unrated-article");
		expect(result[0].title).toBe("未評価記事");
		expect(result[0].isFavorite).toBe(false);
		expect(result[0].label).toBeNull();
	});

	test("全て評価済みの場合は空配列を返す", async () => {
		// モックデータの準備（空配列）
		mockDbClient.all.mockResolvedValue([]);

		// 実行
		const result = await repository.findUnrated();

		// 検証
		expect(result).toHaveLength(0);
	});

	test("記事が存在しない場合は空配列を返す", async () => {
		// モックデータの準備（空配列）
		mockDbClient.all.mockResolvedValue([]);

		// 実行
		const result = await repository.findUnrated();

		// 検証
		expect(result).toHaveLength(0);
	});

	test("ラベル付き未評価記事を正確に取得する", async () => {
		// モックデータの準備
		const mockResult = [
			{
				bookmark: {
					id: 1,
					url: "https://example.com/labeled-unrated",
					title: "ラベル付き未評価記事",
					isRead: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				favorite: null,
				label: {
					id: 1,
					name: "JavaScript",
					description: "JavaScript関連記事",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			},
		];

		mockDbClient.all.mockResolvedValue(mockResult);

		// 実行
		const result = await repository.findUnrated();

		// 検証
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(1);
		expect(result[0].label?.name).toBe("JavaScript");
		expect(result[0].label?.description).toBe("JavaScript関連記事");
	});

	test("お気に入り付き未評価記事を正確に取得する", async () => {
		// モックデータの準備
		const mockResult = [
			{
				bookmark: {
					id: 1,
					url: "https://example.com/favorite-unrated",
					title: "お気に入り未評価記事",
					isRead: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				favorite: {
					id: 1,
					bookmarkId: 1,
					createdAt: new Date(),
				},
				label: null,
			},
		];

		mockDbClient.all.mockResolvedValue(mockResult);

		// 実行
		const result = await repository.findUnrated();

		// 検証
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(1);
		expect(result[0].isFavorite).toBe(true);
	});

	test("既読・未読を問わず未評価記事を取得する", async () => {
		// モックデータの準備
		const mockResult = [
			{
				bookmark: {
					id: 1,
					url: "https://example.com/unread-unrated",
					title: "未読未評価記事",
					isRead: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				favorite: null,
				label: null,
			},
			{
				bookmark: {
					id: 2,
					url: "https://example.com/read-unrated",
					title: "既読未評価記事",
					isRead: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				favorite: null,
				label: null,
			},
		];

		mockDbClient.all.mockResolvedValue(mockResult);

		// 実行
		const result = await repository.findUnrated();

		// 検証
		expect(result).toHaveLength(2);
		const unreadArticle = result.find((r) => r.id === 1);
		const readArticle = result.find((r) => r.id === 2);

		expect(unreadArticle?.isRead).toBe(false);
		expect(readArticle?.isRead).toBe(true);
	});
});
