import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { DrizzleBookmarkRepository } from "./repositories/bookmark";
import { createBookmarksRouter } from "./routes/bookmarks";
import { DefaultBookmarkService } from "./services/bookmark";

export interface Env {
	DB: D1Database;
}

// アプリケーションファクトリ関数
export const createApp = (env: Env) => {
	const app = new Hono<{ Bindings: Env }>();

	// CORSの設定
	app.use("*", cors());

	// データベース、リポジトリ、サービスの初期化
	const db = drizzle(env.DB);
	const repository = new DrizzleBookmarkRepository(db);
	const service = new DefaultBookmarkService(repository);

	// ルーターのマウント
	const bookmarksRouter = createBookmarksRouter(service);
	app.route("/api/bookmarks", bookmarksRouter);

	return app;
};

// デフォルトのエクスポート
export default {
	fetch: (request: Request, env: Env) => {
		const app = createApp(env);
		return app.fetch(request, env);
	},
};
