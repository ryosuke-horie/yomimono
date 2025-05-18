import type { InsertRssFeed, RssFeed } from "../../db/schema";

export interface RssFeedRepository {
	/**
	 * すべてのRSSフィードを取得する
	 * @returns RSSフィードの配列
	 */
	findAll(): Promise<RssFeed[]>;

	/**
	 * 指定されたIDのRSSフィードを取得する
	 * @param id - RSSフィードID
	 * @returns RSSフィード（存在しない場合はnull）
	 */
	findById(id: number): Promise<RssFeed | null>;

	/**
	 * 新しいRSSフィードを作成する
	 * @param data - 作成するRSSフィードのデータ
	 * @returns 作成されたRSSフィード
	 */
	create(data: InsertRssFeed): Promise<RssFeed>;

	/**
	 * RSSフィードを更新する
	 * @param id - 更新するRSSフィードのID
	 * @param data - 更新データ
	 * @returns 更新されたRSSフィード（存在しない場合はnull）
	 */
	update(id: number, data: Partial<InsertRssFeed>): Promise<RssFeed | null>;

	/**
	 * RSSフィードを削除する
	 * @param id - 削除するRSSフィードのID
	 * @returns 削除成功の場合true、対象が存在しない場合false
	 */
	delete(id: number): Promise<boolean>;
}
