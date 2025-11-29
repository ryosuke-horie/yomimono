/**
 * シードデータ管理API ルート
 * 開発環境でのテストデータ生成・管理エンドポイントを提供
 */
import { Hono } from "hono";
import {
	BadRequestError,
	createErrorResponse,
	createErrorResponseBody,
	toContentfulStatusCode,
} from "../exceptions";
import type { ISeedService } from "../interfaces/service/seed";
import {
	validateNumber,
	validateOptionalBoolean,
	validateOptionalNumber,
	validateRequestBody,
} from "../utils/validation";

interface SeedRequestBody {
	bookmarkCount?: number;
	labelCount?: number;
	favoriteRatio?: number;
	forceRun?: boolean;
}

export const createSeedRouter = (seedService: ISeedService) => {
	const app = new Hono();

	// POST /api/dev/seed - シードデータ生成
	app.post("/", async (c) => {
		try {
			// リクエストボディの取得（オプション）
			let options: SeedRequestBody = {};
			const contentType = c.req.header("content-type");

			if (contentType?.includes("application/json")) {
				try {
					const body = await c.req.json();
					options = validateRequestBody(body) as SeedRequestBody;
				} catch (_e) {
					// JSONパースエラーの場合はデフォルトオプションを使用
					options = {};
				}
			}

			// オプションのバリデーション
			const seedOptions = {
				bookmarkCount: validateOptionalNumber(
					options.bookmarkCount,
					"bookmarkCount",
					1,
					100,
				),
				labelCount: validateOptionalNumber(
					options.labelCount,
					"labelCount",
					1,
					20,
				),
				favoriteRatio: validateOptionalNumber(
					options.favoriteRatio,
					"favoriteRatio",
					0,
					1,
				),
				forceRun: validateOptionalBoolean(options.forceRun, "forceRun"),
			};

			// シードデータを生成
			const result = await seedService.generateSeedData(seedOptions);

			if (result.success) {
				return c.json({
					success: true,
					message: result.message,
					data: {
						generated: result.generated,
						executionTimeMs: result.executionTimeMs,
					},
				});
			}

			return c.json(
				{
					success: false,
					error: result.message,
				},
				500,
			);
		} catch (error) {
			console.error("シードデータ生成エンドポイントでエラーが発生:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	// POST /api/dev/seed/clear - データベースクリア
	app.post("/clear", async (c) => {
		try {
			const result = await seedService.clearAllData();

			if (result.success) {
				return c.json({
					success: true,
					message: result.message,
					data: {
						cleared: {
							bookmarks: Math.abs(result.generated.bookmarks),
							labels: Math.abs(result.generated.labels),
							articleLabels: Math.abs(result.generated.articleLabels),
							favorites: Math.abs(result.generated.favorites),
						},
						executionTimeMs: result.executionTimeMs,
					},
				});
			}

			return c.json(
				{
					success: false,
					error: result.message,
				},
				500,
			);
		} catch (error) {
			console.error("データベースクリアエンドポイントでエラーが発生:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	// GET /api/dev/seed/status - データベース状態取得
	app.get("/status", async (c) => {
		try {
			const status = await seedService.getDatabaseStatus();

			return c.json({
				success: true,
				data: status,
			});
		} catch (error) {
			console.error("データベース状態取得エンドポイントでエラーが発生:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	// POST /api/dev/seed/custom - カスタムパラメータでシードデータ生成
	app.post("/custom", async (c) => {
		try {
			let body: {
				bookmarkCount?: number;
				labelCount?: number;
				favoriteRatio?: number;
				forceRun?: boolean;
			};

			try {
				body = await c.req.json();
			} catch (_e) {
				throw new BadRequestError("Invalid JSON in request body");
			}

			validateRequestBody(body);

			// パラメータのバリデーション
			const customOptions = {
				bookmarkCount: body.bookmarkCount
					? validateNumber(body.bookmarkCount, "bookmarkCount", 1, 100)
					: undefined,
				labelCount: body.labelCount
					? validateNumber(body.labelCount, "labelCount", 1, 20)
					: undefined,
				favoriteRatio: body.favoriteRatio
					? validateNumber(body.favoriteRatio, "favoriteRatio", 0, 1)
					: undefined,
				forceRun: validateOptionalBoolean(body.forceRun, "forceRun"),
			};

			// シードデータを生成
			const result = await seedService.generateSeedData(customOptions);

			if (result.success) {
				return c.json({
					success: true,
					message: result.message,
					data: {
						options: customOptions,
						generated: result.generated,
						executionTimeMs: result.executionTimeMs,
					},
				});
			}

			return c.json(
				{
					success: false,
					error: result.message,
					options: customOptions,
				},
				500,
			);
		} catch (error) {
			console.error(
				"カスタムシードデータ生成エンドポイントでエラーが発生:",
				error,
			);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	return app;
};
