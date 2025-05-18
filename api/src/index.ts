import { Hono } from "hono";
import { cors } from "hono/cors";
import { ArticleLabelRepository } from "./repositories/articleLabel";
import { DrizzleBookmarkRepository } from "./repositories/bookmark";
import { LabelRepository } from "./repositories/label";
import { RssFeedRepository } from "./repositories/rssFeed";
import { createBookmarksRouter } from "./routes/bookmarks";
import labelsRouter from "./routes/labels";
import { createRssFeedsRouter } from "./routes/rssFeeds";
import { createSummaryRouter } from "./routes/summary";
import { DefaultBookmarkService } from "./services/bookmark";
import { LabelService } from "./services/label";
import { RssFeedService } from "./services/rssFeed";
import { SummaryService } from "./services/summary";

export interface Env {
	DB: D1Database;
}

// アプリケーションファクトリ関数
export const createApp = (env: Env) => {
	const app = new Hono<{ Bindings: Env }>();

	// CORSの設定
	app.use("*", cors());

	// データベース、リポジトリ、サービスの初期化
	const db = env.DB;
	const bookmarkRepository = new DrizzleBookmarkRepository(db);
	const labelRepository = new LabelRepository(db);
	const articleLabelRepository = new ArticleLabelRepository(db);
	const rssFeedRepository = new RssFeedRepository(db);
	const bookmarkService = new DefaultBookmarkService(bookmarkRepository);
	const labelService = new LabelService(
		labelRepository,
		articleLabelRepository,
		bookmarkRepository,
	);
	const summaryService = new SummaryService(bookmarkRepository);
	const rssFeedService = new RssFeedService(rssFeedRepository);

	// ルーターのマウント
	const bookmarksRouter = createBookmarksRouter(bookmarkService, labelService);
	app.route("/api/bookmarks", bookmarksRouter);
	app.route("/api/labels", labelsRouter);

	const summaryRouter = createSummaryRouter(summaryService);
	app.route("/api", summaryRouter);

	// RSSフィードルートの追加
	const rssFeedsRouter = createRssFeedsRouter(rssFeedService);
	app.route("/api/rss", rssFeedsRouter);

	return app;
};

// デフォルトのエクスポート
export default {
	fetch: (request: Request, env: Env) => {
		const app = createApp(env);
		return app.fetch(request, env);
	},
};
