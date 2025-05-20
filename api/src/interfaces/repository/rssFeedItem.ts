import type { InsertRssFeedItem, RssFeedItem } from "../../db/schema";

export interface FindWithPaginationParams {
	feedId?: number;
	limit: number;
	offset: number;
}

export interface RssFeedItemRepository {
	/**
	 * RSSフィードアイテムを作成する
	 * @param item - 作成するアイテムデータ
	 * @returns 作成されたアイテム
	 */
	create(item: InsertRssFeedItem): Promise<RssFeedItem>;

	/**
	 * 複数のRSSフィードアイテムを一括作成する
	 * @param items - 作成するアイテムのリスト
	 * @returns 作成されたアイテム数
	 */
	createMany(items: InsertRssFeedItem[]): Promise<number>;

	/**
	 * フィードIDとGUIDからRSSフィードアイテムを検索する
	 * @param feedId - フィードID
	 * @param guid - アイテムのGUID
	 * @returns 見つかったアイテムまたはundefined
	 */
	findByFeedIdAndGuid(
		feedId: number,
		guid: string,
	): Promise<RssFeedItem | undefined>;

	/**
	 * フィードIDに基づいてRSSフィードアイテムを取得する
	 * @param feedId - フィードID
	 * @returns アイテムのリスト
	 */
	findByFeedId(feedId: number): Promise<RssFeedItem[]>;

	/**
	 * ページネーション付きでRSSフィードアイテムを取得する
	 * @param params - 取得パラメータ
	 * @returns アイテムのリスト
	 */
	findWithPagination(params: FindWithPaginationParams): Promise<RssFeedItem[]>;

	/**
	 * RSSフィードアイテムの総数を取得する
	 * @param feedId - フィルタするフィードID（オプション）
	 * @returns アイテムの総数
	 */
	getTotalCount(feedId?: number): Promise<number>;
}