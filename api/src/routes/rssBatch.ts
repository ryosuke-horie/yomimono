import type { D1Database } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { RSSBatchProcessor } from "../services/batchProcessor";
import { FeedProcessor } from "../services/feedProcessor";

export const createRssBatchRouter = (db: D1Database) => {
	const app = new Hono();

	// 手動バッチ実行エンドポイント
	app.post("/api/rss/batch/execute", async (c) => {
		try {
			const body = await c.req.json<{ feedIds?: number[] }>();
			const feedIds = body.feedIds;

			const jobId = crypto.randomUUID();
			const processor = new RSSBatchProcessor(db);

			// 非同期でバッチ処理を開始
			c.executionCtx.waitUntil(
				(async () => {
					console.log(`手動バッチ実行開始: ジョブID=${jobId}`);

					try {
						// バッチ開始のログを記録
						const batchLogId = await processor.logBatchStart(
							feedIds?.length
								? `手動バッチ実行 (${feedIds.length}フィード)`
								: "手動バッチ実行 (全フィード)",
						);

						// フィードを取得
						const activeFeeds = await processor.getActiveFeeds();
						const targetFeeds = feedIds?.length
							? activeFeeds.filter((feed) => feedIds.includes(feed.id))
							: activeFeeds;

						console.log(`処理対象フィード数: ${targetFeeds.length}`);

						if (targetFeeds.length === 0) {
							await processor.logBatchComplete(
								batchLogId,
								"completed",
								0,
								0,
								0,
							);
							return;
						}

						// 処理統計
						let successCount = 0;
						let errorCount = 0;
						const errors: string[] = [];

						// フィードを順番に処理
						for (const feed of targetFeeds) {
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
							targetFeeds.length,
							successCount,
							errorCount,
						);

						console.log(
							`手動バッチ処理完了: ジョブID=${jobId}, 総数=${targetFeeds.length}, 成功=${successCount}, エラー=${errorCount}`,
						);
					} catch (error) {
						console.error("手動バッチ処理エラー:", error);
						await processor.logBatchError(error);
					}
				})(),
			);

			return c.json({
				jobId,
				status: "started",
				targetFeeds: feedIds?.length || "all",
				startedAt: new Date().toISOString(),
			});
		} catch (error) {
			console.error("手動バッチ実行エラー:", error);
			return c.json({ error: "Failed to start batch execution" }, 500);
		}
	});

	// バッチ実行ログ取得エンドポイント
	app.get("/api/rss/batch/logs", async (c) => {
		try {
			const processor = new RSSBatchProcessor(db);
			// ログ取得メソッドが必要（後で実装）
			return c.json({ message: "Batch logs endpoint (not implemented yet)" });
		} catch (error) {
			console.error("バッチログ取得エラー:", error);
			return c.json({ error: "Failed to fetch batch logs" }, 500);
		}
	});

	return app;
};
