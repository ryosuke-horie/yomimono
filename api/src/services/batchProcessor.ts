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
			console.log("RSSフィードテーブルからアクティブなフィードを取得中...");
			const feeds = await this.db
				.select({
					id: rssFeeds.id,
					url: rssFeeds.url,
					feedName: rssFeeds.name,
					lastFetchedAt: rssFeeds.lastFetchedAt,
				})
				.from(rssFeeds)
				.where(eq(rssFeeds.isActive, true));

			console.log(`取得したフィード数: ${feeds.length}`);
			return feeds;
		} catch (error) {
			console.error("Error fetching active feeds:", error);
			throw new Error("Failed to fetch active feeds");
		}
	}

	/**
	 * バッチ処理の開始をログに記録
	 */
	async logBatchStart(description = "RSS定期バッチ"): Promise<number> {
		try {
			console.log(`バッチログ記録開始: ${description}`);
			const result = await this.db
				.insert(rssBatchLogs)
				.values({
					status: "in_progress",
					startedAt: new Date(),
					feedId: 1, // 暫定的に1を使用（後でスキーマ変更が必要）
					itemsCreated: 0,
					itemsFetched: 0,
				})
				.returning({ id: rssBatchLogs.id });

			console.log(`バッチログID: ${result[0].id}`);
			return result[0].id;
		} catch (error) {
			console.error("Error logging batch start:", error);
			throw new Error("Failed to log batch start");
		}
	}

	/**
	 * バッチ処理の完了をログに記録
	 */
	async logBatchComplete(
		batchLogId: number,
		status: "completed" | "partial_failure",
		totalFeeds: number,
		successCount: number,
		errorCount: number,
	): Promise<void> {
		try {
			await this.db
				.update(rssBatchLogs)
				.set({
					status,
					finishedAt: new Date(),
					itemsCreated: successCount,
					itemsFetched: totalFeeds,
				})
				.where(eq(rssBatchLogs.id, batchLogId));

			console.log(
				`バッチログ更新: ID=${batchLogId}, ステータス=${status}, 成功=${successCount}, エラー=${errorCount}`,
			);
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
			itemsFetched: number;
			itemsCreated: number;
			errorMessage?: string;
			startedAt: Date;
			finishedAt: Date;
		},
	): Promise<void> {
		try {
			await this.db.insert(rssBatchLogs).values({
				feedId,
				status,
				itemsFetched: details.itemsFetched,
				itemsCreated: details.itemsCreated,
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
