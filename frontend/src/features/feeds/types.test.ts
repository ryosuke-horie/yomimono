/**
 * フィード型定義のテスト
 */
import { describe, expect, it } from "vitest";
import type { RSSFeed } from "./types";

describe("フィード型定義", () => {
	it("RSSFeed型が正しく定義されている", () => {
		const rssFeed: RSSFeed = {
			id: 1,
			name: "テストフィード",
			url: "https://example.com/rss",
			isActive: true,
			createdAt: "2024-01-01T00:00:00.000Z",
			lastFetchedAt: null,
		};

		expect(rssFeed).toBeDefined();
		expect(typeof rssFeed.id).toBe("number");
		expect(typeof rssFeed.name).toBe("string");
		expect(typeof rssFeed.url).toBe("string");
		expect(typeof rssFeed.isActive).toBe("boolean");
		expect(typeof rssFeed.createdAt).toBe("string");
		expect(rssFeed.lastFetchedAt).toBeNull();
	});

	it("RSSFeed型でlastFetchedAtが設定されている場合も正しく動作する", () => {
		const rssFeed: RSSFeed = {
			id: 1,
			name: "テストフィード",
			url: "https://example.com/rss",
			isActive: true,
			createdAt: "2024-01-01T00:00:00.000Z",
			lastFetchedAt: "2024-01-01T12:00:00.000Z",
		};

		expect(rssFeed).toBeDefined();
		expect(typeof rssFeed.lastFetchedAt).toBe("string");
	});
});
