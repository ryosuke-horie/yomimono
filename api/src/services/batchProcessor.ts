import type { D1Database } from "@cloudflare/workers-types";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { rssBatchLogs, rssFeeds } from "../db/schema";

export class RSSBatchProcessor {
	private db;

	constructor(private d1Database: D1Database) {
		this.db = drizzle(d1Database);
	}

	/**
	 * アクティブなRSSフィードを取得
	 */
	async getActiveFeeds(): Promise<
		Array<{
			id: number;
			url: string;
			feedName: string;
			lastFetchedAt: Date | null;
		}>
	> {
		try {
			const feeds = await this.db
				.select({
					id: rssFeeds.id,
					url: rssFeeds.url,
					feedName: rssFeeds.name,
					lastFetchedAt: rssFeeds.lastFetchedAt,
				})
				.from(rssFeeds)
				.where(eq(rssFeeds.isActive, true));

			return feeds;
		} catch (error) {
			console.error("Error fetching active feeds:", error);
			throw new Error("Failed to fetch active feeds");
		}
	}

	/**
	 * バッチ処理の開始をログに記録
	 */
	async logBatchStart(): Promise<number> {
		try {
			const result = await this.db
				.insert(rssBatchLogs)
				.values({
					status: "in_progress",
					startedAt: new Date(),
					feedId: 0, // バッチ全体のログなのでfeedIdは0とする
					itemsCreated: 0,
					itemsFetched: 0,
				})
				.returning({ id: rssBatchLogs.id });

			return result[0].id;
		} catch (error) {
			console.error("Error logging batch start:", error);
			throw new Error("Failed to log batch start");
		}
	}

	/**
	 * バッチ処理の完了をログに記録
	 */
	async logBatchComplete(feedsProcessed: number): Promise<void> {
		try {
			await this.db.insert(rssBatchLogs).values({
				status: "success",
				itemsCreated: feedsProcessed,
				itemsFetched: feedsProcessed,
				startedAt: new Date(),
				finishedAt: new Date(),
				feedId: 0, // バッチ全体のログなのでfeedIdは0とする
			});
		} catch (error) {
			console.error("Error logging batch complete:", error);
			throw new Error("Failed to log batch complete");
		}
	}

	/**
	 * バッチ処理のエラーをログに記録
	 */
	async logBatchError(error: unknown): Promise<void> {
		try {
			const errorMessage =
				error instanceof Error ? error.message : String(error);

			await this.db.insert(rssBatchLogs).values({
				status: "error",
				errorMessage,
				startedAt: new Date(),
				finishedAt: new Date(),
				feedId: 0, // バッチ全体のログなのでfeedIdは0とする
				itemsCreated: 0,
				itemsFetched: 0,
			});
		} catch (logError) {
			console.error("Error logging batch error:", logError);
			// ログエラーは無視して処理を続行
		}
	}

	/**
	 * フィード処理の完了をログに記録
	 */
	async logFeedProcess(
		feedId: number,
		status: "success" | "error",
		details: {
			itemsFetched?: number;
			itemsCreated?: number;
			errorMessage?: string;
			startedAt: Date;
			finishedAt: Date;
		},
	): Promise<void> {
		try {
			await this.db.insert(rssBatchLogs).values({
				feedId,
				status,
				itemsFetched: details.itemsFetched || 0,
				itemsCreated: details.itemsCreated || 0,
				errorMessage: details.errorMessage,
				startedAt: details.startedAt,
				finishedAt: details.finishedAt,
			});
		} catch (error) {
			console.error("Error logging feed process:", error);
			// ログエラーは無視して処理を続行
		}
	}
}
