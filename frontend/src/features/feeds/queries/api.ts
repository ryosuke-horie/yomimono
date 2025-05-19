import { API_BASE_URL } from "@/lib/api/config";
import type {
	CreateRSSFeedDTO,
	RSSFeed,
	RSSFeedDetailResponse,
	RSSFeedResponse,
	UpdateRSSFeedDTO,
} from "../types";

const BASE_PATH = "/api/rss/feeds";

export const feedsApi = {
	// RSSフィード一覧を取得
	getFeeds: async (): Promise<RSSFeedResponse> => {
		const response = await fetch(`${API_BASE_URL}${BASE_PATH}`);
		if (!response.ok) {
			throw new Error(`Failed to fetch feeds: ${response.statusText}`);
		}
		return response.json();
	},

	// RSSフィード詳細を取得
	getFeedById: async (id: number): Promise<RSSFeedDetailResponse> => {
		const response = await fetch(`${API_BASE_URL}${BASE_PATH}/${id}`);
		if (!response.ok) {
			throw new Error(`Failed to fetch feed: ${response.statusText}`);
		}
		return response.json();
	},

	// RSSフィードを作成
	createFeed: async (data: CreateRSSFeedDTO): Promise<RSSFeed> => {
		const response = await fetch(`${API_BASE_URL}${BASE_PATH}`, {
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
		const response = await fetch(`${API_BASE_URL}${BASE_PATH}/${id}`, {
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
		const response = await fetch(`${API_BASE_URL}${BASE_PATH}/${id}`, {
			method: "DELETE",
		});
		if (!response.ok) {
			throw new Error(`Failed to delete feed: ${response.statusText}`);
		}
	},
};
