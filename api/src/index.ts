import { drizzle } from "drizzle-orm/d1"; // Keep only one import
import { Hono } from "hono";
import { cors } from "hono/cors";
import { DrizzleBookmarkRepository } from "./repositories/bookmark";
import { LabelRepository } from "./repositories/label"; // Import LabelRepository
import { ArticleLabelRepository } from "./repositories/articleLabel"; // Import ArticleLabelRepository
import { createBookmarksRouter } from "./routes/bookmarks";
import labelsRouter from "./routes/labels"; // Import labels router
import { DefaultBookmarkService } from "./services/bookmark";
import { LabelService } from "./services/label"; // Import LabelService

export interface Env {
	DB: D1Database;
}

// アプリケーションファクトリ関数
export const createApp = (env: Env) => {
	const app = new Hono<{ Bindings: Env }>();

	// CORSの設定
	app.use("*", cors());

	// データベース、リポジトリ、サービスの初期化
	const db = env.DB; // Use raw D1Database instance from env
	const bookmarkRepository = new DrizzleBookmarkRepository(db);
	const labelRepository = new LabelRepository(db);
	const articleLabelRepository = new ArticleLabelRepository(db);
	const bookmarkService = new DefaultBookmarkService(bookmarkRepository);
	const labelService = new LabelService(
		labelRepository,
		articleLabelRepository,
		bookmarkRepository, // Pass bookmarkRepository to LabelService
	);

	// ルーターのマウント
	const bookmarksRouter = createBookmarksRouter(bookmarkService, labelService); // Pass labelService
	app.route("/api/bookmarks", bookmarksRouter);
	app.route("/api/labels", labelsRouter); // Mount labels router

	return app;
};

// デフォルトのエクスポート
export default {
	fetch: (request: Request, env: Env) => {
		const app = createApp(env);
		return app.fetch(request, env);
	},
};
