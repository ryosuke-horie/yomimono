import type { D1Database } from "@cloudflare/workers-types";
import { RSSBatchProcessor } from "../services/batchProcessor";
import { FeedProcessor } from "../services/feedProcessor";

export interface Env {
	DB: D1Database;
	NODE_ENV?: string;
}

export default {
	async scheduled(
		controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> {
		console.log("RSS バッチ処理開始");

		const db = env.DB;
		const processor = new RSSBatchProcessor(db);

		try {
			console.log("DB接続確認");
			// バッチ開始のログを記録
			const batchLogId = await processor.logBatchStart("RSS定期バッチ");
			console.log(`バッチログID: ${batchLogId}`);

			// アクティブなRSSフィードを取得
			console.log("アクティブなフィードを取得中...");
			const activeFeeds = await processor.getActiveFeeds();
			console.log(`アクティブなフィード数: ${activeFeeds.length}`);

			if (activeFeeds.length === 0) {
				console.log("処理対象のフィードがありません");
				await processor.logBatchComplete(batchLogId, "completed", 0, 0, 0);
				return;
			}

			// 処理統計
			let successCount = 0;
			let errorCount = 0;
			const errors: string[] = [];

			// フィードを順番に処理（並行処理は後で実装）
			for (const feed of activeFeeds) {
				console.log(`処理中のフィード: ${feed.feedName}`);
				const feedProcessor = new FeedProcessor(feed, db);

				try {
					await feedProcessor.process();
					successCount++;
					console.log(`フィード処理成功: ${feed.feedName}`);
				} catch (error) {
					errorCount++;
					const errorMessage = `フィード処理エラー (${feed.feedName}): ${
						error instanceof Error ? error.message : String(error)
					}`;
					console.error(errorMessage);
					errors.push(errorMessage);
				}
			}

			// バッチ処理完了
			await processor.logBatchComplete(
				batchLogId,
				errorCount > 0 ? "partial_failure" : "completed",
				activeFeeds.length,
				successCount,
				errorCount,
			);

			console.log(
				`バッチ処理完了: 総数=${activeFeeds.length}, 成功=${successCount}, エラー=${errorCount}`,
			);
		} catch (error) {
			console.error("バッチ処理エラー:", error);
			throw error;
		}
	},
};
