import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { DrizzleBookmarkRepository } from "./repositories/bookmark";
import { createBookmarksRouter } from "./routes/bookmarks";
import { DefaultBookmarkService } from "./services/bookmark";

export interface Env {
	DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

// CORSの設定
app.use("*", cors());

// アプリケーションの初期化
app.use("*", async (c, next) => {
	// D1データベースの初期化
	const db = drizzle(c.env.DB);

	// リポジトリとサービスの初期化
	const repository = new DrizzleBookmarkRepository(db);
	const service = new DefaultBookmarkService(repository);

	// ルーターのマウント
	const bookmarksRouter = createBookmarksRouter(service);
	app.route("/api/bookmarks", bookmarksRouter);

	await next();
});

export default app;
