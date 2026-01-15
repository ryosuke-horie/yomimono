import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	resetDrizzleClientMock,
	setupDrizzleClientMock,
} from "../../tests/drizzle.mock";
import { DrizzleBookmarkRepository } from "./bookmark";

const { mockDb } = setupDrizzleClientMock();

vi.mock("drizzle-orm", () => ({
	eq: vi.fn(),
	gte: vi.fn(),
	isNull: vi.fn(),
	and: vi.fn(),
	count: vi.fn(),
	inArray: vi.fn(),
}));

beforeEach(() => {
	vi.clearAllMocks();
	resetDrizzleClientMock(mockDb);
});

describe("バッチラベル付け関連のリポジトリメソッド", () => {
	describe("DrizzleBookmarkRepository - findByIds", () => {
		let repository: DrizzleBookmarkRepository;
		let mockDb: unknown;

		beforeEach(() => {
			mockDb = {
				prepare: vi.fn().mockReturnThis(),
				bind: vi.fn().mockReturnThis(),
				all: vi.fn(),
				get: vi.fn(),
			};
			// biome-ignore lint/suspicious/noExplicitAny: Testing with mock db
			repository = new DrizzleBookmarkRepository(mockDb as any);
		});

		it("指定されたIDのブックマークをMapで返す", async () => {
			const ids = [1, 2, 3];
			const mockBookmarks = [
				{
					bookmark: {
						id: 1,
						url: "https://example.com/1",
						title: "Article 1",
						description: null,
						createdAt: new Date(),
						updatedAt: new Date(),
						isRead: false,
					},
					favorite: null,
					label: null,
				},
				{
					bookmark: {
						id: 3,
						url: "https://example.com/3",
						title: "Article 3",
						description: null,
						createdAt: new Date(),
						updatedAt: new Date(),
						isRead: false,
					},
					favorite: { id: 1, bookmarkId: 3, createdAt: new Date() },
					label: {
						id: 1,
						name: "javascript",
						description: null,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				},
			];

			// Mock Drizzle calls
			// biome-ignore lint/suspicious/noExplicitAny: Testing with mock db
			const mockedDb = (repository as any).db;
			mockedDb.select.mockReturnThis();
			mockedDb.from.mockReturnThis();
			mockedDb.leftJoin.mockReturnThis();
			mockedDb.where.mockReturnThis();
			mockedDb.all.mockResolvedValue(mockBookmarks);

			const result = await repository.findByIds(ids);

			expect(result.size).toBe(2);
			expect(result.get(1)).toMatchObject({
				id: 1,
				title: "Article 1",
				isFavorite: false,
				label: null,
			});
			expect(result.get(3)).toMatchObject({
				id: 3,
				title: "Article 3",
				isFavorite: true,
				label: { id: 1, name: "javascript" },
			});
			expect(result.get(2)).toBeUndefined();
		});
	});
});
