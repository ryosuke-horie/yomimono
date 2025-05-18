import type { D1Database } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { RSSBatchProcessor } from "../services/batchProcessor";
import { FeedProcessor } from "../services/feedProcessor";

export const createRssBatchRouter = (db: D1Database) => {
	const app = new Hono();

	// 手動バッチ実行エンドポイント
	app.post("/batch/execute", async (c) => {
		try {
			console.log("手動バッチ実行リクエスト受信");
			const body = await c.req.json<{ feedIds?: number[] }>();
			const feedIds = body.feedIds;
			console.log("feedIds:", feedIds);

			const jobId = crypto.randomUUID();
			console.log("ジョブID生成:", jobId);
			
			const processor = new RSSBatchProcessor(db);
			console.log("RSSBatchProcessor初期化");

			// まず同期的にレスポンスを返す
			const response = {
				jobId,
				status: "started",
				targetFeeds: feedIds?.length || "all",
				startedAt: new Date().toISOString(),
			};

			// 非同期でバッチ処理を開始（レスポンスには影響しない）
			if (c.executionCtx) {
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
			} else {
				console.warn("ExecutionContext not available - バッチ処理は実行されません");
			}

			return c.json(response);
		} catch (error) {
			console.error("手動バッチ実行エラー:", error);
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error("エラー詳細:", errorMessage);
			console.error("エラースタック:", error instanceof Error ? error.stack : "");
			return c.json({ 
				error: "Failed to start batch execution",
				details: errorMessage
			}, 500);
		}
	});

	// バッチ実行ログ取得エンドポイント
	app.get("/batch/logs", async (c) => {
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