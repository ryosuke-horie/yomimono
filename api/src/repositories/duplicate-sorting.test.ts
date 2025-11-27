/**
 * JOINによる重複行とソートの問題を検証するテスト
 *
 * 問題:
 * - findUnread()はLEFT JOINを使用し、複数ラベルを持つブックマークが重複して返される
 * - findByLabelName()はINNER JOINを使用し、特定ラベルのブックマークが1回だけ返される
 * - この違いによりソート順序が異なって見える可能性がある
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createDrizzleClientMock,
	createDrizzleD1ModuleMock,
} from "./test-utils/drizzle-mock";
import { DrizzleBookmarkRepository } from "./bookmark";

const mockDbClient = createDrizzleClientMock();

vi.mock("drizzle-orm/d1", () => createDrizzleD1ModuleMock(mockDbClient));

describe("JOIN重複によるソートの問題", () => {
	let bookmarkRepo: DrizzleBookmarkRepository;
	const DUMMY_DB = {} as D1Database;

	beforeEach(() => {
		vi.clearAllMocks();
		bookmarkRepo = new DrizzleBookmarkRepository(DUMMY_DB);
	});

	it("修正後のfindUnread()では複数ラベルを持つブックマークが重複せず最初のラベルのみ返される", async () => {
		// 1回目のクエリ（ブックマーク + お気に入り）
		const bookmarksResult = [
			{
				bookmark: {
					id: 1,
					url: "https://example.com/1",
					title: "Article 1",
					isRead: false,
					createdAt: new Date("2024-01-01T10:00:00Z"),
					updatedAt: new Date("2024-01-01T10:00:00Z"),
				},
				favorite: null,
			},
		];
		// 2回目のクエリ（ラベル）- 複数ラベルが存在
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
		];

		mockDbClient.all
			.mockResolvedValueOnce(bookmarksResult)
			.mockResolvedValueOnce(labelsResult);

		const result = await bookmarkRepo.findUnread();

		// 修正後: 同じブックマークは1回だけ返される
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(1);
		// 最初のラベルのみが設定される（重複排除）
		expect(result[0].label?.name).toBe("frontend");
	});

	it("findByLabelName()では同じブックマークが1回だけ返される", async () => {
		// モックデータ: 特定ラベルでフィルタされた結果
		const mockResults = [
			{
				bookmark: {
					id: 1,
					url: "https://example.com/1",
					title: "Article 1",
					isRead: false,
					createdAt: new Date("2024-01-01T10:00:00Z"),
					updatedAt: new Date("2024-01-01T10:00:00Z"),
				},
				favorite: null,
				label: {
					id: 1,
					name: "frontend",
					description: "Frontend tech",
					createdAt: new Date("2024-01-01T09:00:00Z"),
					updatedAt: new Date("2024-01-01T09:00:00Z"),
				},
			},
		];

		mockDbClient.all.mockResolvedValue(mockResults);

		const result = await bookmarkRepo.findByLabelName("frontend");

		// 同じブックマークが1回だけ返される
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(1);
		expect(result[0].label?.name).toBe("frontend");
	});

	it("修正後は重複がなく正しいソート順序で返される", async () => {
		// 1回目のクエリ（ブックマーク + お気に入り）- ソート済み
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
		// 2回目のクエリ（ラベル）
		const labelsResult = [
			{
				articleId: 2,
				label: {
					id: 2,
					name: "react",
					description: "React framework",
					createdAt: new Date("2024-01-01T09:00:00Z"),
					updatedAt: new Date("2024-01-01T09:00:00Z"),
				},
			},
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
					id: 3,
					name: "react", // 2つ目のラベル（重複排除される）
					description: "React framework",
					createdAt: new Date("2024-01-01T09:00:00Z"),
					updatedAt: new Date("2024-01-01T09:00:00Z"),
				},
			},
		];

		mockDbClient.all
			.mockResolvedValueOnce(bookmarksResult)
			.mockResolvedValueOnce(labelsResult);

		const result = await bookmarkRepo.findUnread();

		// 修正後: 重複がなく正しいソート順（新しい順）
		expect(result).toHaveLength(2);
		expect(result[0].id).toBe(2); // 新しい記事が最初
		expect(result[1].id).toBe(1); // 古い記事が次

		// ラベル情報が正しく設定される（最初のラベルのみ）
		expect(result[0].label?.name).toBe("react");
		expect(result[1].label?.name).toBe("frontend"); // 複数ラベルでも最初のもののみ
	});
});

// No tests currently implemented in this file
