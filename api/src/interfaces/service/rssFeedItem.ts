import type { RssFeedItem } from "../../db/schema";

export interface GetRssFeedItemsParams {
	feedId?: number;
	limit?: number;
	offset?: number;
}

export interface GetRssFeedItemsResult {
	items: (RssFeedItem & { isBookmarked: boolean; feedName: string })[];
	total: number;
	hasMore: boolean;
}

export interface RssFeedItemService {
	/**
	 * RSSフィードアイテムを取得する
	 * @param params - 取得パラメータ (フィードID、リミット、オフセット)
	 * @returns 取得結果 (アイテム一覧、総数、追加ページがあるか)
	 */
	getItems(params: GetRssFeedItemsParams): Promise<GetRssFeedItemsResult>;
}