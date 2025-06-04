/**
 * RSS フィード関連の型定義
 */
export interface RSSFeed {
	id: number;
	name: string;
	url: string;
	isActive: boolean;
	updateInterval: number;
	lastFetchedAt: string | null;
	nextFetchAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateRSSFeedDTO {
	name: string;
	url: string;
	updateInterval?: number;
	isActive?: boolean;
}

export interface UpdateRSSFeedDTO {
	name?: string;
	url?: string;
	updateInterval?: number;
	isActive?: boolean;
}

export interface RSSFeedResponse {
	feeds: RSSFeed[];
	total: number;
}

export interface RSSFeedDetailResponse extends RSSFeed {
	stats: {
		totalItems: number;
		todayItems: number;
		lastWeekItems: number;
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe("RSSFeed型", () => {
		it("RSSFeed型のプロパティが正しく定義されている", () => {
			const feed: RSSFeed = {
				id: 1,
				name: "テストフィード",
				url: "https://example.com/rss",
				isActive: true,
				updateInterval: 3600,
				lastFetchedAt: "2024-01-01T00:00:00Z",
				nextFetchAt: "2024-01-01T01:00:00Z",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};
			expect(feed.id).toBe(1);
			expect(feed.name).toBe("テストフィード");
		});

		it("CreateRSSFeedDTO型のプロパティが正しく定義されている", () => {
			const dto: CreateRSSFeedDTO = {
				name: "新しいフィード",
				url: "https://example.com/rss",
			};
			expect(dto.name).toBe("新しいフィード");
			expect(dto.url).toBe("https://example.com/rss");
		});
	});
}
