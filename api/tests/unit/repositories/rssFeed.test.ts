import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RssFeed } from "../../../src/db/schema";
import { RssFeedRepository } from "../../../src/repositories/rssFeed";

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

describe("RssFeedRepository", () => {
	let rssFeedRepository: RssFeedRepository;

	beforeEach(() => {
		vi.clearAllMocks();
		const mockD1Database = {} as D1Database;
		rssFeedRepository = new RssFeedRepository(mockD1Database);
	});

	describe("create", () => {
		it("新しいRSSフィードを作成できる", async () => {
			const newFeed = {
				name: "Tech Blog",
				url: "https://example.com/feed.xml",
				isActive: true,
			};

			const expectedFeed: RssFeed = {
				id: 1,
				name: "Tech Blog",
				url: "https://example.com/feed.xml",
				isActive: true,
				lastFetchedAt: null,
				nextFetchAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockDb.all.mockResolvedValueOnce([expectedFeed]);

			const result = await rssFeedRepository.create(newFeed);

			expect(mockDb.insert).toHaveBeenCalledWith(
				rssFeedRepository.rssFeedsTable,
			);
			expect(mockDb.values).toHaveBeenCalledWith(newFeed);
			expect(mockDb.returning).toHaveBeenCalled();
			expect(result).toEqual(expectedFeed);
		});
	});

	describe("findById", () => {
		it("IDでRSSフィードを取得できる", async () => {
			const expectedFeed: RssFeed = {
				id: 1,
				name: "Tech Blog",
				url: "https://example.com/feed.xml",
				isActive: true,
				lastFetchedAt: null,
				nextFetchAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockDb.get.mockResolvedValueOnce(expectedFeed);

			const result = await rssFeedRepository.findById(1);

			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(rssFeedRepository.rssFeedsTable);
			expect(mockDb.where).toHaveBeenCalled();
			expect(result).toEqual(expectedFeed);
		});
	});

	describe("findByUrl", () => {
		it("URLでRSSフィードを取得できる", async () => {
			const url = "https://example.com/feed.xml";
			const expectedFeed: RssFeed = {
				id: 1,
				name: "Tech Blog",
				url: url,
				isActive: true,
				lastFetchedAt: null,
				nextFetchAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockDb.get.mockResolvedValueOnce(expectedFeed);

			const result = await rssFeedRepository.findByUrl(url);

			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(rssFeedRepository.rssFeedsTable);
			expect(mockDb.where).toHaveBeenCalled();
			expect(result).toEqual(expectedFeed);
		});
	});

	describe("findAllActive", () => {
		it("アクティブなRSSフィードをすべて取得できる", async () => {
			const expectedFeeds: RssFeed[] = [
				{
					id: 1,
					name: "Tech Blog",
					url: "https://example.com/feed.xml",
					isActive: true,
					lastFetchedAt: null,
					nextFetchAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					name: "News Feed",
					url: "https://news.com/feed.xml",
					isActive: true,
					lastFetchedAt: null,
					nextFetchAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockDb.all.mockResolvedValueOnce(expectedFeeds);

			const result = await rssFeedRepository.findAllActive();

			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(rssFeedRepository.rssFeedsTable);
			expect(mockDb.where).toHaveBeenCalled();
			expect(result).toEqual(expectedFeeds);
		});
	});

	describe("update", () => {
		it("RSSフィードを更新できる", async () => {
			const id = 1;
			const updateData = {
				name: "Updated Tech Blog",
				lastFetchedAt: new Date(),
			};

			const updatedFeed: RssFeed = {
				id: 1,
				name: "Updated Tech Blog",
				url: "https://example.com/feed.xml",
				isActive: true,
				lastFetchedAt: updateData.lastFetchedAt,
				nextFetchAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockDb.all.mockResolvedValueOnce([updatedFeed]);

			const result = await rssFeedRepository.update(id, updateData);

			expect(mockDb.update).toHaveBeenCalledWith(
				rssFeedRepository.rssFeedsTable,
			);
			expect(mockDb.set).toHaveBeenCalledWith({
				...updateData,
				updatedAt: expect.any(Date),
			});
			expect(mockDb.where).toHaveBeenCalled();
			expect(mockDb.returning).toHaveBeenCalled();
			expect(result).toEqual(updatedFeed);
		});
	});
});
