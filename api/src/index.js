import { desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { bookmarks, rssBatchLogs } from "./db/schema";
import { ArticleLabelRepository } from "./repositories/articleLabel";
import { DrizzleBookmarkRepository } from "./repositories/bookmark";
import { LabelRepository } from "./repositories/label";
import { RssFeedRepository } from "./repositories/rssFeed";
import { RssFeedItemRepository } from "./repositories/rssFeedItem";
import { createBookmarksRouter } from "./routes/bookmarks";
import labelsRouter from "./routes/labels";
import { createRssFeedsRouter } from "./routes/rssFeeds";
import { createRssItemsRouter } from "./routes/rssItems";
import { createSummaryRouter } from "./routes/summary";
import { DefaultBookmarkService } from "./services/bookmark";
import { LabelService } from "./services/label";
import { RssFeedService } from "./services/rssFeed";
import { RssFeedItemService } from "./services/rssFeedItem";
import { SummaryService } from "./services/summary";
import rssBatch from "./workers/rssBatch";
// アプリケーションファクトリ関数
export const createApp = (env) => {
	const app = new Hono();
	// CORSの設定
	app.use("*", cors());
	// グローバルエラーハンドラの追加
	app.onError((err, c) => {
		console.error(`Error: ${err}`);
		// HTTPExceptionの場合は適切なステータスコードとメッセージを返す
		if (err instanceof HTTPException) {
			return c.json({ error: err.message }, err.status);
		}
		// その他のエラーの場合は500エラーを返す
		return c.json({ error: "Internal Server Error" }, 500);
	});
	// データベース、リポジトリ、サービスの初期化
	const db = env.DB;
	const bookmarkRepository = new DrizzleBookmarkRepository(db);
	const labelRepository = new LabelRepository(db);
	const articleLabelRepository = new ArticleLabelRepository(db);
	const rssFeedRepository = new RssFeedRepository(db);
	const rssFeedItemRepository = new RssFeedItemRepository(db);
	const bookmarkService = new DefaultBookmarkService(bookmarkRepository);
	const labelService = new LabelService(
		labelRepository,
		articleLabelRepository,
		bookmarkRepository,
	);
	const summaryService = new SummaryService(bookmarkRepository);
	const rssFeedService = new RssFeedService(rssFeedRepository);
	const rssFeedItemService = new RssFeedItemService(
		rssFeedItemRepository,
		rssFeedRepository,
		bookmarkRepository,
	);
	// ルーターのマウント
	const bookmarksRouter = createBookmarksRouter(bookmarkService, labelService);
	app.route("/api/bookmarks", bookmarksRouter);
	app.route("/api/labels", labelsRouter);
	const summaryRouter = createSummaryRouter(summaryService);
	app.route("/api", summaryRouter);
	// RSSフィードルートの追加
	const rssFeedsRouter = createRssFeedsRouter(rssFeedService);
	app.route("/api/rss", rssFeedsRouter);
	// RSSアイテムルートの追加
	const rssItemsRouter = createRssItemsRouter(rssFeedItemService);
	app.route("/api/rss", rssItemsRouter);
	// テストエンドポイント
	app.get("/api/dev/test", (c) => {
		return c.json({ message: "API is working!" });
	});
	// データベース接続テスト
	app.get("/api/dev/db-test", async (c) => {
		try {
			const result = await rssFeedRepository.findAllActive();
			return c.json({
				message: "DB connection successful",
				activeFeeds: result.length,
				feeds: result.map((f) => ({ id: f.id, name: f.name, url: f.url })),
			});
		} catch (error) {
			return c.json(
				{
					message: "DB connection failed",
					error: error instanceof Error ? error.message : String(error),
				},
				500,
			);
		}
	});
	// バッチログ確認エンドポイント
	app.get("/api/dev/batch-logs", async (c) => {
		try {
			const drizzleDb = drizzle(c.env.DB);
			const logs = await drizzleDb
				.select()
				.from(rssBatchLogs)
				.orderBy(desc(rssBatchLogs.startedAt))
				.limit(10);
			return c.json({
				success: true,
				logs,
			});
		} catch (error) {
			return c.json(
				{
					success: false,
					error: error instanceof Error ? error.message : String(error),
				},
				500,
			);
		}
	});
	// 最新ブックマーク確認エンドポイント
	app.get("/api/dev/recent-bookmarks", async (c) => {
		try {
			const drizzleDb = drizzle(c.env.DB);
			const recentBookmarks = await drizzleDb
				.select()
				.from(bookmarks)
				.orderBy(desc(bookmarks.createdAt))
				.limit(10);
			return c.json({
				success: true,
				count: recentBookmarks.length,
				bookmarks: recentBookmarks.map((b) => ({
					id: b.id,
					title: b.title,
					url: b.url,
					isRead: b.isRead,
					createdAt: b.createdAt,
				})),
			});
		} catch (error) {
			return c.json(
				{
					success: false,
					error: error instanceof Error ? error.message : String(error),
				},
				500,
			);
		}
	});
	// 開発環境用：手動バッチ実行エンドポイント
	// Cloudflare Workersではprocess.envが使えないため、wrangler.tomlで定義される環境変数を使用
	app.post("/api/dev/rss-batch/run", async (c) => {
		const mockController = {
			noRetry: () => {},
			waitUntil: () => {},
		};
		const mockContext = {
			waitUntil: () => {},
		};
		try {
			await rssBatch.scheduled(mockController, c.env, mockContext);
			return c.json({ success: true, message: "バッチ処理が完了しました" });
		} catch (error) {
			console.error("バッチ処理エラー:", error);
			return c.json(
				{
					success: false,
					error: error instanceof Error ? error.message : String(error),
				},
				500,
			);
		}
	});
	return app;
};
// デフォルトのエクスポート
export default {
	fetch: (request, env) => {
		const app = createApp(env);
		return app.fetch(request, env);
	},
};
