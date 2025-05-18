import type { D1Database, ExportedHandler } from "@cloudflare/workers-types";
import { RSSBatchProcessor } from "../services/batchProcessor";
import { FeedProcessor } from "../services/feedProcessor";

export interface Env {
	DB: D1Database;
	// RSS_BATCH_QUEUE: Queue;  今後の拡張用にコメントアウト
}

export default {
	async scheduled(
		controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> {
		const batchProcessor = new RSSBatchProcessor(env.DB);

		try {
			// アクティブなフィードを取得
			const activeFeeds = await batchProcessor.getActiveFeeds();

			if (activeFeeds.length === 0) {
				console.log("No active feeds to process");
				return;
			}

			// 並行処理の設定
			const CONCURRENT_LIMIT = 10;
			const chunks = chunk(activeFeeds, CONCURRENT_LIMIT);

			// チャンク毎に処理
			for (const feedChunk of chunks) {
				await Promise.all(feedChunk.map((feed) => processFeed(feed, env)));
			}

			// バッチ完了ログ
			await batchProcessor.logBatchComplete(activeFeeds.length);
		} catch (error) {
			console.error("Batch processing error:", error);
			await batchProcessor.logBatchError(error);
		}
	},
} satisfies ExportedHandler<Env>;

// 配列をチャンクに分割するヘルパー関数
function chunk<T>(array: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
}

// フィード処理関数
async function processFeed(
	feed: { id: number; url: string; feedName: string },
	env: Env,
): Promise<void> {
	console.log(`Processing feed: ${feed.feedName} (${feed.url})`);
	const processor = new FeedProcessor(feed, env.DB);

	try {
		await processor.process();
		console.log(`Successfully processed feed: ${feed.feedName}`);
	} catch (error) {
		console.error(`Error processing feed ${feed.feedName}:`, error);
		// エラーがあっても他のフィードの処理は継続
	}
}
