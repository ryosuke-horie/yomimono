import { desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { bookmarks } from "./db/schema";
import { ArticleLabelRepository } from "./repositories/articleLabel";
import { DrizzleBookmarkRepository } from "./repositories/bookmark";
import { LabelRepository } from "./repositories/label";
import { createBookmarksRouter } from "./routes/bookmarks";
import labelsRouter from "./routes/labels";
import { DefaultBookmarkService } from "./services/bookmark";
import { LabelService } from "./services/label";

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
	const labelRepository = new LabelRepository(db);
	const articleLabelRepository = new ArticleLabelRepository(db);
	const bookmarkService = new DefaultBookmarkService(bookmarkRepository);
	const labelService = new LabelService(
		labelRepository,
		articleLabelRepository,
		bookmarkRepository,
	);

	// ルーターのマウント
	const bookmarksRouter = createBookmarksRouter(bookmarkService, labelService);
	app.route("/api/bookmarks", bookmarksRouter);
	app.route("/api/labels", labelsRouter);

	// テストエンドポイント
	app.get("/api/dev/test", (c) => {
		return c.json({ message: "API is working!" });
	});

	// データベース接続テスト
	app.get("/api/dev/db-test", async (c) => {
		try {
			const drizzleDb = drizzle(c.env.DB);
			const result = await drizzleDb.select().from(bookmarks).limit(1);
			return c.json({
				message: "DB connection successful",
				bookmarkCount: result.length,
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

	return app;
};

// デフォルトのエクスポート
export default {
	fetch: (request: Request, env: Env) => {
		const app = createApp(env);
		return app.fetch(request, env);
	},
};
