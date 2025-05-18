import type { D1Database } from "@cloudflare/workers-types";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import {
	type Bookmark,
	type RssFeedItem,
	bookmarks,
	rssFeedItems,
	rssFeeds,
} from "../db/schema";
import type { Article } from "../types/rss";
import { RSSBatchProcessor } from "./batchProcessor";
import { RSSFetcher } from "./rssFetcher";
import { RSSParser } from "./rssParser";

export class FeedProcessor {
	private db;
	private fetcher: RSSFetcher;
	private parser: RSSParser;
	private batchProcessor: RSSBatchProcessor;

	constructor(
		private feed: {
			id: number;
			url: string;
			feedName: string;
			lastFetchedAt?: Date | null;
		},
		private d1Database: D1Database,
	) {
		this.db = drizzle(d1Database);
		this.fetcher = new RSSFetcher();
		this.parser = new RSSParser();
		this.batchProcessor = new RSSBatchProcessor(d1Database);
	}

	/**
	 * フィードを処理する
	 */
	async process(): Promise<void> {
		const startedAt = new Date();
		let itemsFetched = 0;
		let itemsCreated = 0;

		try {
			// 1. フィード取得
			const feedData = await this.fetcher.fetchFeed(this.feed.url);

			// 2. XML解析
			const articles = await this.parser.parseFeed(feedData);
			itemsFetched = articles.length;

			// 3. 新着記事のフィルタリング
			const newArticles = await this.filterNewArticles(articles);

			// 4. ブックマーク登録
			itemsCreated = await this.saveArticles(newArticles);

			// 5. フィードの最終取得日時を更新
			await this.updateFeedLastFetchedAt();

			// 6. 成功ログ記録
			await this.batchProcessor.logFeedProcess(this.feed.id, "success", {
				itemsFetched,
				itemsCreated,
				startedAt,
				finishedAt: new Date(),
			});
		} catch (error) {
			// エラーログ記録
			await this.batchProcessor.logFeedProcess(this.feed.id, "error", {
				itemsFetched,
				itemsCreated,
				errorMessage: error instanceof Error ? error.message : String(error),
				startedAt,
				finishedAt: new Date(),
			});
			throw error;
		}
	}

	/**
	 * 新着記事をフィルタリングする
	 */
	private async filterNewArticles(articles: Article[]): Promise<Article[]> {
		// URL重複チェック
		const urls = articles.map((a) => a.url);
		const existingUrls = await this.getExistingUrls(urls);

		// 新着記事のみを抽出
		const newArticles = articles.filter(
			(article) => !existingUrls.includes(article.url),
		);

		// 最終取得日時以降の記事のみを抽出（パブリッシュ日がある場合）
		if (this.feed.lastFetchedAt) {
			const lastFetch = new Date(this.feed.lastFetchedAt);
			return newArticles.filter(
				(article) => !article.publishedAt || article.publishedAt > lastFetch,
			);
		}

		return newArticles;
	}

	/**
	 * 既存のURLを取得する
	 */
	private async getExistingUrls(urls: string[]): Promise<string[]> {
		try {
			// ブックマークテーブルから既存URLを確認
			const existingBookmarks = await this.db
				.select({ url: bookmarks.url })
				.from(bookmarks)
				.where(
					urls.length === 1
						? eq(bookmarks.url, urls[0])
						: urls.length > 0
							? and(...urls.map((url) => eq(bookmarks.url, url)))
							: undefined,
				);

			// RSS記事履歴テーブルからも確認
			const existingItems = await this.db
				.select({ url: rssFeedItems.url })
				.from(rssFeedItems)
				.where(
					urls.length === 1
						? eq(rssFeedItems.url, urls[0])
						: urls.length > 0
							? and(...urls.map((url) => eq(rssFeedItems.url, url)))
							: undefined,
				);

			const existingUrlSet = new Set([
				...existingBookmarks.map((b) => b.url),
				...existingItems.map((i) => i.url),
			]);

			return Array.from(existingUrlSet);
		} catch (error) {
			console.error("Error checking existing URLs:", error);
			return [];
		}
	}

	/**
	 * 記事をデータベースに保存する
	 */
	private async saveArticles(articles: Article[]): Promise<number> {
		if (articles.length === 0) {
			return 0;
		}

		try {
			// トランザクション処理（D1はバッチ処理で代用）
			const bookmarkInserts = articles.map((article) => {
				const bookmarkData = {
					url: article.url,
					title: article.title,
					isRead: false,
					createdAt: article.publishedAt || new Date(),
					updatedAt: new Date(),
				};
				console.log("Inserting bookmark:", bookmarkData);
				return this.db
					.insert(bookmarks)
					.values(bookmarkData)
					.returning({ id: bookmarks.id })
					.prepare();
			});

			const bookmarkResults = await this.d1Database.batch(bookmarkInserts);

			// RSS記事情報をrss_feed_itemsテーブルに保存（取得履歴として）
			const feedItemInserts = articles.map((article) => {
				const feedItemData = {
					feedId: this.feed.id,
					guid: article.guid,
					url: article.url,
					title: article.title,
					description: article.description,
					publishedAt: article.publishedAt || null,
					fetchedAt: new Date(),
					createdAt: new Date(),
				};
				console.log("Inserting feed item:", feedItemData);
				return this.db
					.insert(rssFeedItems)
					.values(feedItemData)
					.prepare();
			});

			await this.d1Database.batch(feedItemInserts);

			return articles.length;
		} catch (error) {
			console.error("Error saving articles:", error);
			console.error("Detailed error:", JSON.stringify(error, null, 2));
			throw new Error(`Failed to save articles: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * フィードの最終取得日時を更新する
	 */
	private async updateFeedLastFetchedAt(): Promise<void> {
		try {
			await this.db
				.update(rssFeeds)
				.set({
					lastFetchedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(rssFeeds.id, this.feed.id));
		} catch (error) {
			console.error("Error updating feed last fetched time:", error);
			// エラーは記録するが処理は継続
		}
	}
}
