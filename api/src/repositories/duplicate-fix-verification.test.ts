/**
 * JOIN重複問題の修正を検証するテスト
 *
 * 修正後のfindUnread()メソッドが重複を正しく排除し、
 * ソート順序を維持することを確認します。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DrizzleBookmarkRepository } from "./bookmark";

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

describe("JOIN重複問題の修正検証", () => {
	let bookmarkRepo: DrizzleBookmarkRepository;
	const DUMMY_DB = {} as D1Database;

	beforeEach(() => {
		vi.clearAllMocks();
		bookmarkRepo = new DrizzleBookmarkRepository(DUMMY_DB);
	});

	it("修正後のfindUnread()は重複を排除して正しいソート順で返す", async () => {
		// 1回目のクエリ（ブックマーク取得）のモックデータ
		const bookmarksResult = [
			{
				bookmark: {
					id: 2,
					url: "https://example.com/2",
					title: "New Article",
					isRead: false,
					createdAt: new Date("2024-01-02T10:00:00Z"), // 新しい
					updatedAt: new Date("2024-01-02T10:00:00Z"),
				},
				favorite: null,
			},
			{
				bookmark: {
					id: 1,
					url: "https://example.com/1",
					title: "Old Article",
					isRead: false,
					createdAt: new Date("2024-01-01T10:00:00Z"), // 古い
					updatedAt: new Date("2024-01-01T10:00:00Z"),
				},
				favorite: null,
			},
		];

		// 2回目のクエリ（ラベル取得）のモックデータ
		const labelsResult = [
			{
				articleId: 1,
				label: {
					id: 1,
					name: "frontend",
					description: "Frontend tech",
					createdAt: new Date("2024-01-01T09:00:00Z"),
					updatedAt: new Date("2024-01-01T09:00:00Z"),
				},
			},
			{
				articleId: 1,
				label: {
					id: 2,
					name: "react",
					description: "React framework",
					createdAt: new Date("2024-01-01T09:00:00Z"),
					updatedAt: new Date("2024-01-01T09:00:00Z"),
				},
			},
			{
				articleId: 2,
				label: {
					id: 3,
					name: "backend",
					description: "Backend tech",
					createdAt: new Date("2024-01-01T09:00:00Z"),
					updatedAt: new Date("2024-01-01T09:00:00Z"),
				},
			},
		];

		// モックの設定：1回目の呼び出しはブックマーク、2回目はラベル
		mockDbClient.all
			.mockResolvedValueOnce(bookmarksResult)
			.mockResolvedValueOnce(labelsResult);

		const result = await bookmarkRepo.findUnread();

		// 検証：重複が排除され、正しいソート順（新しい順）で返される
		expect(result).toHaveLength(2);
		expect(result[0].id).toBe(2); // 新しい記事が最初
		expect(result[1].id).toBe(1); // 古い記事が次

		// 検証：各ブックマークは1回だけ現れる
		const ids = result.map((b) => b.id);
		expect(ids).toEqual([2, 1]);

		// 検証：ラベル情報が正しく付与される（最初のラベルのみ）
		expect(result[0].label?.name).toBe("backend");
		expect(result[1].label?.name).toBe("frontend"); // 複数ラベルの場合は最初のもの

		// 検証：お気に入り情報が正しく設定される
		expect(result[0].isFavorite).toBe(false);
		expect(result[1].isFavorite).toBe(false);
	});

	it("ラベルがないブックマークも正しく処理される", async () => {
		const bookmarksResult = [
			{
				bookmark: {
					id: 1,
					url: "https://example.com/1",
					title: "No Label Article",
					isRead: false,
					createdAt: new Date("2024-01-01T10:00:00Z"),
					updatedAt: new Date("2024-01-01T10:00:00Z"),
				},
				favorite: null,
			},
		];

		const labelsResult: Array<{
			articleId: number;
			label: {
				id: number;
				name: string;
				description: string;
				createdAt: Date;
				updatedAt: Date;
			};
		}> = []; // ラベルなし

		mockDbClient.all
			.mockResolvedValueOnce(bookmarksResult)
			.mockResolvedValueOnce(labelsResult);

		const result = await bookmarkRepo.findUnread();

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(1);
		expect(result[0].label).toBe(null); // ラベルがない場合はnull
		expect(result[0].isFavorite).toBe(false);
	});

	it("ブックマークが存在しない場合は空配列を返す", async () => {
		mockDbClient.all.mockResolvedValueOnce([]); // 空の結果

		const result = await bookmarkRepo.findUnread();

		expect(result).toHaveLength(0);
		expect(result).toEqual([]);

		// 2回目のクエリは実行されない
		expect(mockDbClient.all).toHaveBeenCalledTimes(1);
	});

	it("お気に入りブックマークが正しく識別される", async () => {
		const bookmarksResult = [
			{
				bookmark: {
					id: 1,
					url: "https://example.com/1",
					title: "Favorite Article",
					isRead: false,
					createdAt: new Date("2024-01-01T10:00:00Z"),
					updatedAt: new Date("2024-01-01T10:00:00Z"),
				},
				favorite: {
					id: 1,
					bookmarkId: 1,
					createdAt: new Date("2024-01-01T10:00:00Z"),
				},
			},
		];

		const labelsResult = [
			{
				articleId: 1,
				label: {
					id: 1,
					name: "favorite",
					description: "Favorite tech",
					createdAt: new Date("2024-01-01T09:00:00Z"),
					updatedAt: new Date("2024-01-01T09:00:00Z"),
				},
			},
		];

		mockDbClient.all
			.mockResolvedValueOnce(bookmarksResult)
			.mockResolvedValueOnce(labelsResult);

		const result = await bookmarkRepo.findUnread();

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(1);
		expect(result[0].isFavorite).toBe(true); // お気に入りフラグが正しく設定される
		expect(result[0].label?.name).toBe("favorite");
	});
});

// No tests currently implemented in this file
