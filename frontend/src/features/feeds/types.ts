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
