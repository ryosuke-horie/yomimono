import { API_BASE_URL } from "@/lib/api/config";
import type {
	CreateRSSFeedDTO,
	RSSFeed,
	RSSFeedDetailResponse,
	RSSFeedItemsParams,
	RSSFeedItemsResponse,
	RSSFeedResponse,
	UpdateRSSFeedDTO,
} from "../types";

const FEEDS_PATH = "/api/rss/feeds";
const ITEMS_PATH = "/api/rss/items";

// RSSフィード関連のAPI
export const feedsApi = {
	// RSSフィード一覧を取得
	getFeeds: async (): Promise<RSSFeedResponse> => {
		const response = await fetch(`${API_BASE_URL}${FEEDS_PATH}`);
		if (!response.ok) {
			throw new Error(`Failed to fetch feeds: ${response.statusText}`);
		}
		return response.json();
	},

	// RSSフィード詳細を取得
	getFeedById: async (id: number): Promise<RSSFeedDetailResponse> => {
		const response = await fetch(`${API_BASE_URL}${FEEDS_PATH}/${id}`);
		if (!response.ok) {
			throw new Error(`Failed to fetch feed: ${response.statusText}`);
		}
		return response.json();
	},

	// RSSフィードを作成
	createFeed: async (data: CreateRSSFeedDTO): Promise<RSSFeed> => {
		const response = await fetch(`${API_BASE_URL}${FEEDS_PATH}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			throw new Error(`Failed to create feed: ${response.statusText}`);
		}
		return response.json();
	},

	// RSSフィードを更新
	updateFeed: async (id: number, data: UpdateRSSFeedDTO): Promise<RSSFeed> => {
		const response = await fetch(`${API_BASE_URL}${FEEDS_PATH}/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			throw new Error(`Failed to update feed: ${response.statusText}`);
		}
		return response.json();
	},

	// RSSフィードを削除
	deleteFeed: async (id: number): Promise<void> => {
		const response = await fetch(`${API_BASE_URL}${FEEDS_PATH}/${id}`, {
			method: "DELETE",
		});
		if (!response.ok) {
			throw new Error(`Failed to delete feed: ${response.statusText}`);
		}
	},
};

// RSSフィードアイテム関連のAPI
export const feedItemsApi = {
	// RSSフィードアイテム一覧を取得
	getItems: async ({
		feedId,
		limit = 20,
		offset = 0,
	}: RSSFeedItemsParams): Promise<RSSFeedItemsResponse> => {
		// クエリパラメータの構築
		const params = new URLSearchParams();
		if (feedId !== undefined && feedId !== null) {
			params.append("feedId", feedId.toString());
		}
		params.append("limit", limit.toString());
		params.append("offset", offset.toString());

		const url = `${API_BASE_URL}${ITEMS_PATH}?${params.toString()}`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch feed items: ${response.statusText}`);
		}
		return response.json();
	},
};
