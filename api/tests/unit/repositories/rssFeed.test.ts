import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InsertRssFeed, RssFeed } from "../../../src/db/schema";
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

	describe("findAll", () => {
		it("すべてのRSSフィードを取得できる", async () => {
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
					isActive: false,
					lastFetchedAt: null,
					nextFetchAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockDb.all.mockResolvedValueOnce(expectedFeeds);

			const result = await rssFeedRepository.findAll();

			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(rssFeedRepository.rssFeedsTable);
			expect(result).toEqual(expectedFeeds);
		});
	});

	describe("findById", () => {
		it("指定されたIDのRSSフィードを取得できる", async () => {
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

	describe("create", () => {
		it("新しいRSSフィードを作成できる", async () => {
			const newFeed: InsertRssFeed = {
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

	describe("update", () => {
		it("RSSフィードを更新できる", async () => {
			const id = 1;
			const updateData = {
				name: "Updated Tech Blog",
				isActive: false,
			};

			const updatedFeed: RssFeed = {
				id: 1,
				name: "Updated Tech Blog",
				url: "https://example.com/feed.xml",
				isActive: false,
				lastFetchedAt: null,
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

	describe("delete", () => {
		it("RSSフィードを削除できる", async () => {
			const id = 1;

			mockDb.get.mockResolvedValueOnce(true);
			mockDb.all.mockResolvedValueOnce([]);

			const result = await rssFeedRepository.delete(id);

			expect(mockDb.delete).toHaveBeenCalledWith(
				rssFeedRepository.rssFeedsTable,
			);
			expect(mockDb.where).toHaveBeenCalled();
			expect(result).toBe(true);
		});

		it("削除時にエラーが発生した場合falseを返す", async () => {
			const id = 1;

			mockDb.get.mockRejectedValueOnce(new Error("Database error"));

			const result = await rssFeedRepository.delete(id);

			expect(result).toBe(false);
		});
	});

	describe("findByUrl", () => {
		it("URLによってRSSフィードを取得できる", async () => {
			const url = "https://example.com/feed.xml";
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

			const result = await rssFeedRepository.findByUrl(url);

			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(rssFeedRepository.rssFeedsTable);
			expect(mockDb.where).toHaveBeenCalled();
			expect(result).toEqual(expectedFeed);
		});
	});

	describe("findAllActive", () => {
		it.skip("アクティブなRSSフィードを全て取得できる", async () => {
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
			];

			// モック関数をリセット
			vi.clearAllMocks();

			// モックチェーンを再構築
			mockDb.select.mockReturnThis();
			mockDb.from.mockReturnThis();
			mockDb.where.mockReturnThis();
			mockDb.all.mockResolvedValueOnce(expectedFeeds);

			const result = await rssFeedRepository.findAllActive();

			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(rssFeedRepository.rssFeedsTable);
			expect(mockDb.where).toHaveBeenCalled();
			expect(result).toEqual(expectedFeeds);
		});
	});
});
