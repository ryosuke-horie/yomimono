import type { InsertRssFeed, RssFeed } from "../../db/schema";

export interface RssFeedService {
	/**
	 * すべてのRSSフィードを取得する
	 * @returns RSSフィードの配列
	 */
	getAllFeeds(): Promise<RssFeed[]>;

	/**
	 * 指定されたIDのRSSフィードを取得する
	 * @param id - RSSフィードID
	 * @returns RSSフィード
	 * @throws RSSフィードが見つからない場合
	 */
	getFeedById(id: number): Promise<RssFeed>;

	/**
	 * 新しいRSSフィードを作成する
	 * @param data - 作成するRSSフィードのデータ
	 * @returns 作成されたRSSフィード
	 */
	createFeed(data: InsertRssFeed): Promise<RssFeed>;

	/**
	 * RSSフィードを更新する
	 * @param id - 更新するRSSフィードのID
	 * @param data - 更新データ
	 * @returns 更新されたRSSフィード
	 * @throws RSSフィードが見つからない場合
	 */
	updateFeed(id: number, data: Partial<InsertRssFeed>): Promise<RssFeed>;

	/**
	 * RSSフィードを削除する
	 * @param id - 削除するRSSフィードのID
	 * @throws RSSフィードが見つからない場合
	 */
	deleteFeed(id: number): Promise<void>;
}
