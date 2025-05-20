export interface RSSFeedItem {
	id: number;
	feedId: number;
	feedName: string;
	guid: string;
	url: string;
	title: string;
	description: string | null;
	publishedAt: string | null;
	fetchedAt: string;
	createdAt: string;
	isBookmarked: boolean;
}

export interface RSSFeedItemsResponse {
	items: RSSFeedItem[];
	total: number;
	hasMore: boolean;
}

export interface RSSFeedItemsParams {
	feedId?: number | null;
	limit?: number;
	offset?: number;
}