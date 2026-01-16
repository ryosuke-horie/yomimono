import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { DrizzleBookmarkRepository } from "./repositories/bookmark";
import { createBookmarksRouter } from "./routes/bookmarks";
import { DefaultBookmarkService } from "./services/bookmark";

export interface Env {
	DB: D1Database;
	NODE_ENV?: string;
	ENVIRONMENT?: string; // production または development
}

// アプリケーションファクトリ関数
export const createApp = (env: Env) => {
	const app = new Hono<{ Bindings: Env }>();

	// CORSの設定
	app.use("*", cors());

	// グローバルエラーハンドラの追加
	app.onError((err, c) => {
		console.error(`Error: ${err}`);

		// ログ出力を追加（環境情報を含む）
		console.log(
			`環境: ${env.ENVIRONMENT || "unknown"}, NODE_ENV: ${env.NODE_ENV || "unknown"}`,
		);

		// HTTPExceptionの場合は適切なステータスコードとメッセージを返す
		if (err instanceof HTTPException) {
			return c.json({ error: err.message }, err.status);
		}

		// その他のエラーの場合は500エラーを返す
		return c.json({ error: "Internal Server Error" }, 500);
	});

	// 環境情報をログ出力
	if (env.ENVIRONMENT === "development") {
		console.log("開発環境で実行中です。ローカルのD1データベースを使用します。");
	} else {
		console.log("本番環境で実行中です。本番用のD1データベースを使用します。");
	}

	// データベース、リポジトリ、サービスの初期化
	const db = env.DB;
	const bookmarkRepository = new DrizzleBookmarkRepository(db);
	const bookmarkService = new DefaultBookmarkService(bookmarkRepository);

	// ルーターのマウント
	const bookmarksRouter = createBookmarksRouter(bookmarkService);
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
