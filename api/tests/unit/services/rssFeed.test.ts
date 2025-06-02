import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InsertRssFeed, RssFeed } from "../../../src/db/schema";
import type { RssFeedRepository } from "../../../src/interfaces/repository/rssFeed";
import { RssFeedService } from "../../../src/services/rssFeed";

describe("RssFeedService", () => {
	let mockRepository: RssFeedRepository;
	let service: RssFeedService;

	beforeEach(() => {
		mockRepository = {
			findAll: vi.fn(),
			findById: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		};
		service = new RssFeedService(mockRepository);
	});

	describe("getAllFeeds", () => {
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

			vi.mocked(mockRepository.findAll).mockResolvedValueOnce(expectedFeeds);

			const result = await service.getAllFeeds();

			expect(mockRepository.findAll).toHaveBeenCalled();
			expect(result).toEqual(expectedFeeds);
		});
	});

	describe("getFeedById", () => {
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

			vi.mocked(mockRepository.findById).mockResolvedValueOnce(expectedFeed);

			const result = await service.getFeedById(1);

			expect(mockRepository.findById).toHaveBeenCalledWith(1);
			expect(result).toEqual(expectedFeed);
		});

		it("存在しないIDの場合404エラーを投げる", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValueOnce(null);

			await expect(service.getFeedById(999)).rejects.toThrow(
				"RSSフィードが見つかりません: ID 999",
			);
			expect(mockRepository.findById).toHaveBeenCalledWith(999);
		});
	});

	describe("createFeed", () => {
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

			vi.mocked(mockRepository.create).mockResolvedValueOnce(expectedFeed);

			const result = await service.createFeed(newFeed);

			expect(mockRepository.create).toHaveBeenCalledWith(newFeed);
			expect(result).toEqual(expectedFeed);
		});
	});

	describe("updateFeed", () => {
		it("RSSフィードを更新できる", async () => {
			const updateData = {
				name: "Updated Tech Blog",
				isActive: false,
			};

			const expectedFeed: RssFeed = {
				id: 1,
				name: "Updated Tech Blog",
				url: "https://example.com/feed.xml",
				isActive: false,
				lastFetchedAt: null,
				nextFetchAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(mockRepository.update).mockResolvedValueOnce(expectedFeed);

			const result = await service.updateFeed(1, updateData);

			expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
			expect(result).toEqual(expectedFeed);
		});

		it("存在しないIDの場合404エラーを投げる", async () => {
			const updateData = {
				name: "Updated Tech Blog",
			};

			vi.mocked(mockRepository.update).mockResolvedValueOnce(null);

			await expect(service.updateFeed(999, updateData)).rejects.toThrow(
				"RSSフィードが見つかりません: ID 999",
			);
			expect(mockRepository.update).toHaveBeenCalledWith(999, updateData);
		});
	});

	describe("deleteFeed", () => {
		it("RSSフィードを削除できる", async () => {
			vi.mocked(mockRepository.delete).mockResolvedValueOnce(true);

			await service.deleteFeed(1);

			expect(mockRepository.delete).toHaveBeenCalledWith(1);
		});

		it("存在しないIDの場合404エラーを投げる", async () => {
			vi.mocked(mockRepository.delete).mockResolvedValueOnce(false);

			await expect(service.deleteFeed(999)).rejects.toThrow(
				"RSSフィードが見つかりません: ID 999",
			);
			expect(mockRepository.delete).toHaveBeenCalledWith(999);
		});
	});
});
