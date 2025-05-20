import { beforeEach, describe, expect, it, vi } from "vitest";
import { RssFeedItemRepository } from "../../../src/repositories/rssFeedItem";
const mockDb = {
	select: vi.fn().mockReturnThis(),
	from: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	orderBy: vi.fn().mockReturnThis(),
	all: vi.fn(),
	get: vi.fn(),
	insert: vi.fn().mockReturnThis(),
	update: vi.fn().mockReturnThis(),
	set: vi.fn().mockReturnThis(),
	values: vi.fn().mockReturnThis(),
	returning: vi.fn().mockReturnThis(),
	delete: vi.fn().mockReturnThis(),
};
vi.mock("drizzle-orm/d1", () => ({
	drizzle: vi.fn(() => mockDb),
}));
describe("RssFeedItemRepository", () => {
	let rssFeedItemRepository;
	beforeEach(() => {
		vi.clearAllMocks();
		const mockD1Database = {};
		rssFeedItemRepository = new RssFeedItemRepository(mockD1Database);
	});
	describe("create", () => {
		it("新しいRSSフィードアイテムを作成できる", async () => {
			const newItem = {
				feedId: 1,
				guid: "item-123",
				url: "https://example.com/article/123",
				title: "新しい記事",
				description: "記事の概要",
				publishedAt: new Date(),
			};
			const expectedItem = {
				id: 1,
				feedId: 1,
				guid: "item-123",
				url: "https://example.com/article/123",
				title: "新しい記事",
				description: "記事の概要",
				publishedAt: newItem.publishedAt,
				fetchedAt: new Date(),
				createdAt: new Date(),
			};
			mockDb.all.mockResolvedValueOnce([expectedItem]);
			const result = await rssFeedItemRepository.create(newItem);
			expect(mockDb.insert).toHaveBeenCalledWith(
				rssFeedItemRepository.rssFeedItemsTable,
			);
			expect(mockDb.values).toHaveBeenCalledWith(newItem);
			expect(mockDb.returning).toHaveBeenCalled();
			expect(result).toEqual(expectedItem);
		});
	});
	describe("findByFeedIdAndGuid", () => {
		it("フィードIDとGUIDでアイテムを取得できる", async () => {
			const feedId = 1;
			const guid = "item-123";
			const expectedItem = {
				id: 1,
				feedId: 1,
				guid: "item-123",
				url: "https://example.com/article/123",
				title: "新しい記事",
				description: "記事の概要",
				publishedAt: new Date(),
				fetchedAt: new Date(),
				createdAt: new Date(),
			};
			mockDb.get.mockResolvedValueOnce(expectedItem);
			const result = await rssFeedItemRepository.findByFeedIdAndGuid(
				feedId,
				guid,
			);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(
				rssFeedItemRepository.rssFeedItemsTable,
			);
			expect(mockDb.where).toHaveBeenCalled();
			expect(result).toEqual(expectedItem);
		});
	});
	describe("findByFeedId", () => {
		it("フィードIDでアイテムを取得できる", async () => {
			const feedId = 1;
			const expectedItems = [
				{
					id: 1,
					feedId: 1,
					guid: "item-123",
					url: "https://example.com/article/123",
					title: "新しい記事1",
					description: "記事の概要1",
					publishedAt: new Date(),
					fetchedAt: new Date(),
					createdAt: new Date(),
				},
				{
					id: 2,
					feedId: 1,
					guid: "item-124",
					url: "https://example.com/article/124",
					title: "新しい記事2",
					description: "記事の概要2",
					publishedAt: new Date(),
					fetchedAt: new Date(),
					createdAt: new Date(),
				},
			];
			mockDb.all.mockResolvedValueOnce(expectedItems);
			const result = await rssFeedItemRepository.findByFeedId(feedId);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(
				rssFeedItemRepository.rssFeedItemsTable,
			);
			expect(mockDb.where).toHaveBeenCalled();
			expect(mockDb.orderBy).toHaveBeenCalled();
			expect(result).toEqual(expectedItems);
		});
	});
	describe("createMany", () => {
		it("複数のアイテムを一括作成できる", async () => {
			const newItems = [
				{
					feedId: 1,
					guid: "item-123",
					url: "https://example.com/article/123",
					title: "新しい記事1",
					description: "記事の概要1",
					publishedAt: new Date(),
				},
				{
					feedId: 1,
					guid: "item-124",
					url: "https://example.com/article/124",
					title: "新しい記事2",
					description: "記事の概要2",
					publishedAt: new Date(),
				},
			];
			mockDb.all.mockResolvedValueOnce([{ count: 2 }]);
			const result = await rssFeedItemRepository.createMany(newItems);
			expect(mockDb.insert).toHaveBeenCalledWith(
				rssFeedItemRepository.rssFeedItemsTable,
			);
			expect(mockDb.values).toHaveBeenCalledWith(newItems);
			expect(result).toEqual(2);
		});
	});
});
