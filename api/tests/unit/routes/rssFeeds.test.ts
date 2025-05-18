import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import type { RssFeed } from "../../../src/db/schema";
import { createRssFeedsRouter } from "../../../src/routes/rssFeeds";
import type { RssFeedService } from "../../../src/services/rssFeed";

interface FeedsResponse {
	feeds: RssFeed[];
	total: number;
}

interface FeedWithStatsResponse extends RssFeed {
	stats: {
		totalItems: number;
		todayItems: number;
		lastWeekItems: number;
	};
}

describe("rssFeeds route", () => {
	const mockFeed: RssFeed = {
		id: 1,
		name: "Tech Blog",
		url: "https://example.com/feed.xml",
		isActive: true,
		lastFetchedAt: null,
		nextFetchAt: null,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	};

	describe("GET /api/rss/feeds", () => {
		it("すべてのRSSフィードを取得できる", async () => {
			const mockFeeds = [mockFeed, { ...mockFeed, id: 2, name: "News Feed" }];

			const mockService = {
				getAllFeeds: vi.fn().mockResolvedValueOnce(mockFeeds),
			} as unknown as RssFeedService;

			const app = new Hono<{ Bindings: { DB: D1Database } }>();
			app.route("/api/rss", createRssFeedsRouter(mockService));

			const response = await app.request("/api/rss/feeds");
			const json = (await response.json()) as FeedsResponse;

			expect(response.status).toBe(200);
			expect(json.feeds).toEqual(
				mockFeeds.map((feed) => ({
					...feed,
					createdAt: feed.createdAt.toISOString(),
					updatedAt: feed.updatedAt.toISOString(),
				})),
			);
			expect(json.total).toBe(2);
		});
	});

	describe("GET /api/rss/feeds/:id", () => {
		it("指定されたIDのRSSフィードを取得できる", async () => {
			const mockService = {
				getFeedById: vi.fn().mockResolvedValueOnce(mockFeed),
			} as unknown as RssFeedService;

			const app = new Hono<{ Bindings: { DB: D1Database } }>();
			app.route("/api/rss", createRssFeedsRouter(mockService));

			const response = await app.request("/api/rss/feeds/1");
			const json = (await response.json()) as FeedWithStatsResponse;

			expect(response.status).toBe(200);
			expect(json).toEqual({
				...mockFeed,
				createdAt: mockFeed.createdAt.toISOString(),
				updatedAt: mockFeed.updatedAt.toISOString(),
				stats: {
					totalItems: 0,
					todayItems: 0,
					lastWeekItems: 0,
				},
			});
		});
	});

	describe("POST /api/rss/feeds", () => {
		it("新しいRSSフィードを作成できる", async () => {
			const newFeed = {
				name: "New Blog",
				url: "https://newblog.com/feed.xml",
				isActive: true,
			};

			const createdFeed = { ...mockFeed, ...newFeed };

			const mockService = {
				createFeed: vi.fn().mockResolvedValueOnce(createdFeed),
			} as unknown as RssFeedService;

			const app = new Hono<{ Bindings: { DB: D1Database } }>();
			app.route("/api/rss", createRssFeedsRouter(mockService));

			const response = await app.request("/api/rss/feeds", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newFeed),
			});
			const json = (await response.json()) as RssFeed;

			expect(response.status).toBe(201);
			expect(json).toEqual({
				...createdFeed,
				createdAt: createdFeed.createdAt.toISOString(),
				updatedAt: createdFeed.updatedAt.toISOString(),
			});
		});
	});

	describe("PUT /api/rss/feeds/:id", () => {
		it("RSSフィードを更新できる", async () => {
			const updateData = {
				name: "Updated Blog",
				isActive: false,
			};

			const updatedFeed = { ...mockFeed, ...updateData };

			const mockService = {
				updateFeed: vi.fn().mockResolvedValueOnce(updatedFeed),
			} as unknown as RssFeedService;

			const app = new Hono<{ Bindings: { DB: D1Database } }>();
			app.route("/api/rss", createRssFeedsRouter(mockService));

			const response = await app.request("/api/rss/feeds/1", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updateData),
			});
			const json = (await response.json()) as RssFeed;

			expect(response.status).toBe(200);
			expect(json).toEqual({
				...updatedFeed,
				createdAt: updatedFeed.createdAt.toISOString(),
				updatedAt: updatedFeed.updatedAt.toISOString(),
			});
		});
	});

	describe("DELETE /api/rss/feeds/:id", () => {
		it("RSSフィードを削除できる", async () => {
			const mockService = {
				deleteFeed: vi.fn().mockResolvedValueOnce(undefined),
			} as unknown as RssFeedService;

			const app = new Hono<{ Bindings: { DB: D1Database } }>();
			app.route("/api/rss", createRssFeedsRouter(mockService));

			const response = await app.request("/api/rss/feeds/1", {
				method: "DELETE",
			});

			expect(response.status).toBe(204);
			expect(mockService.deleteFeed).toHaveBeenCalledWith(1);
		});
	});
});
