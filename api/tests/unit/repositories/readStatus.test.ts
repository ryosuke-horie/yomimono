import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	articleLabels,
	bookmarks,
	favorites,
	labels,
} from "../../../src/db/schema";
import { DrizzleBookmarkRepository } from "../../../src/repositories/bookmark";

const mockAll = vi.fn();

// Create a chain of mock functions that properly simulate the drizzle query builder pattern
const createMockChain = () => {
	const chain = {
		select: vi.fn(() => chain),
		from: vi.fn(() => chain),
		leftJoin: vi.fn(() => chain),
		where: vi.fn(() => chain),
		orderBy: vi.fn(() => chain),
		all: mockAll,
	};
	return chain;
};

vi.mock("drizzle-orm/d1", () => ({
	drizzle: vi.fn(() => createMockChain()),
}));

describe("Bookmark Repository - Read Status", () => {
	let bookmarkRepository: DrizzleBookmarkRepository;
	const mockDb = {} as D1Database;

	beforeEach(() => {
		vi.clearAllMocks();
		mockAll.mockClear();
		bookmarkRepository = new DrizzleBookmarkRepository(mockDb);
	});

	describe("findRead", () => {
		it("既読のブックマークを取得できる", async () => {
			const mockReadBookmarks = [
				{
					bookmark: {
						id: 1,
						url: "https://example.com/article1",
						title: "既読記事1",
						isFavorite: false,
						isRead: true,
						createdAt: new Date("2024-01-01"),
						updatedAt: new Date("2024-01-10"),
					},
					favorite: null,
					label: {
						id: 1,
						name: "tech",
						description: null,
					},
				},
				{
					bookmark: {
						id: 2,
						url: "https://example.com/article2",
						title: "既読記事2",
						isFavorite: true,
						isRead: true,
						createdAt: new Date("2024-01-02"),
						updatedAt: new Date("2024-01-11"),
					},
					favorite: { bookmarkId: 2 },
					label: null,
				},
			];

			mockAll.mockResolvedValue(mockReadBookmarks);

			const result = await bookmarkRepository.findRead();

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe(1);
			expect(result[0].title).toBe("既読記事1");
			expect(result[0].isFavorite).toBe(false);
			expect(result[0].label).toEqual({
				id: 1,
				name: "tech",
				description: null,
			});
			expect(result[1].id).toBe(2);
			expect(result[1].title).toBe("既読記事2");
			expect(result[1].isFavorite).toBe(true);
			expect(result[1].label).toBe(null);
		});

		it("既読のブックマークがない場合空配列を返す", async () => {
			mockAll.mockResolvedValue([]);

			const result = await bookmarkRepository.findRead();

			expect(result).toEqual([]);
		});
	});
});
