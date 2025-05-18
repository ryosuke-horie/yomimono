/**
 * RSSフィードから取得した記事データの型定義
 */
export interface Article {
	guid: string;
	url: string;
	title: string;
	description?: string;
	publishedAt?: Date;
	author?: string;
	categories?: string[];
}
