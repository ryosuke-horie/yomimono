import { and, eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type {
	GetRssFeedItemsParams,
	GetRssFeedItemsResult,
	RssFeedItemService as IRssFeedItemService,
} from "../interfaces/service/rssFeedItem";
import type { IBookmarkRepository } from "../interfaces/repository/bookmark";
import type { RssFeedRepository } from "../repositories/rssFeed";
import type { RssFeedItemRepository } from "../repositories/rssFeedItem";

export class RssFeedItemService implements IRssFeedItemService {
	constructor(
		private rssFeedItemRepository: RssFeedItemRepository,
		private rssFeedRepository: RssFeedRepository,
		private bookmarkRepository: IBookmarkRepository,
	) {}

	async getItems({
		feedId,
		limit = 20,
		offset = 0,
	}: GetRssFeedItemsParams): Promise<GetRssFeedItemsResult> {
		try {
			// フィードアイテムを取得
			const items = await this.rssFeedItemRepository.findWithPagination({
				feedId,
				limit: limit + 1, // hasMoreの判定用に1件多く取得
				offset,
			});

			// 追加ページがあるかの判定
			const hasMore = items.length > limit;

			// 結果を制限
			const limitedItems = hasMore ? items.slice(0, limit) : items;

			// アイテムが空の場合は早期リターン
			if (limitedItems.length === 0) {
				return {
					items: [],
					total: 0,
					hasMore: false,
				};
			}

			// URLからブックマーク済みのアイテムを判定
			const urls = limitedItems.map((item) => item.url);
			const bookmarks = await this.bookmarkRepository.findByUrls(urls);
			const bookmarkedUrls = new Set(bookmarks.map((bookmark: { url: string }) => bookmark.url));

			// フィード名を取得
			const feedIds = [...new Set(limitedItems.map((item) => item.feedId))];
			const feeds = await this.rssFeedRepository.findByIds(feedIds);
			const feedMap = new Map(feeds.map((feed) => [feed.id, feed.name]));

			// 結果を構築
			const result = limitedItems.map((item) => ({
				...item,
				isBookmarked: bookmarkedUrls.has(item.url),
				feedName: feedMap.get(item.feedId) || "Unknown Feed",
			}));

			// 合計数を取得（通常は別のリクエストで取得するが、シンプルにするため仮の実装）
			const total = await this.rssFeedItemRepository.getTotalCount(feedId);

			return {
				items: result,
				total,
				hasMore,
			};
		} catch (error) {
			console.error("Failed to get RSS feed items:", error);
			throw new HTTPException(500, {
				message: "Failed to get RSS feed items",
			});
		}
	}
}