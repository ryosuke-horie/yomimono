export interface RSSFeed {
	id: number;
	name: string;
	url: string;
	isActive: boolean;
	updateInterval: number;
	lastFetchedAt: string | null;
	nextFetchAt: string | null;
	itemCount: number;
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

export interface ExecuteBatchRequest {
	feedIds: number[];
}

export interface ExecuteBatchResponse {
	jobId: string;
	status: string;
	targetFeeds: number | string;
	startedAt: string;
}

export interface BatchLog {
	id: number;
	feedId: number;
	status: "in_progress" | "completed" | "partial_failure" | "error";
	itemsFetched: number;
	itemsCreated: number;
	errorMessage?: string;
	startedAt: string;
	finishedAt?: string;
}
