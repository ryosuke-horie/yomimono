import type { D1Database } from "@cloudflare/workers-types";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { bookmarks, rssFeedItems, rssFeeds } from "../db/schema";
import { DatabaseError } from "../exceptions";
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
			console.log(`フィード処理開始: ${this.feed.feedName} (${this.feed.url})`);

			// 1. フィード取得
			console.log("フィードデータを取得中...");
			const feedData = await this.fetcher.fetchFeed(this.feed.url);
			console.log("フィードデータ取得完了");

			// 2. XML解析
			console.log("XMLを解析中...");
			const articles = await this.parser.parseFeed(feedData);
			itemsFetched = articles.length;
			console.log(`解析完了: ${itemsFetched}件の記事を取得`);

			// 3. 新着記事のフィルタリング
			console.log("新着記事をフィルタリング中...");
			const newArticles = await this.filterNewArticles(articles);
			console.log(`新着記事数: ${newArticles.length}件`);

			// 4. ブックマーク登録
			console.log("記事を保存中...");
			itemsCreated = await this.saveArticles(newArticles);
			console.log(`保存完了: ${itemsCreated}件の記事を保存`);

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
			let successCount = 0;

			// バッチ処理の代わりに1つずつ処理して問題を特定
			for (const article of articles) {
				try {
					// ブックマークを保存
					const bookmarkData = {
						url: article.url,
						title: article.title,
						isRead: false,
						// D1はDateオブジェクトを直接扱えないので、必要に応じて変換
					};
					console.log("Inserting bookmark:", JSON.stringify(bookmarkData));

					const bookmarkResult = await this.db
						.insert(bookmarks)
						.values(bookmarkData)
						.returning({ id: bookmarks.id });

					console.log("Bookmark inserted, id:", bookmarkResult[0]?.id);

					// RSS記事情報をrss_feed_itemsテーブルに保存（取得履歴として）
					const feedItemData = {
						feedId: this.feed.id,
						guid: article.guid,
						url: article.url,
						title: article.title,
						description: article.description || "",
						publishedAt: article.publishedAt,
					};
					console.log("Inserting feed item:", JSON.stringify(feedItemData));

					await this.db.insert(rssFeedItems).values(feedItemData);

					console.log("Feed item inserted");
					successCount++;
				} catch (articleError) {
					console.error("Error saving article:", article.url, articleError);
					// 個別のエラーは無視して処理を続行
				}
			}

			return successCount;
		} catch (error) {
			console.error("Error saving articles:", error);
			console.error("Detailed error:", JSON.stringify(error, null, 2));
			throw new DatabaseError(
				`Failed to save articles: ${error instanceof Error ? error.message : String(error)}`,
			);
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
