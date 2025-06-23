/**
 * 記事評価ポイントのルーター実装
 */
import { Hono } from "hono";
import { z } from "zod";
import {
	BadRequestError,
	ConflictError,
	createErrorResponse,
	createErrorResponseBody,
	NotFoundError,
	ValidationError,
} from "../exceptions";
import type { IRatingService } from "../interfaces/service/rating";

// バリデーションスキーマ
const CreateRatingSchema = z.object({
	practicalValue: z.number().int().min(1).max(10),
	technicalDepth: z.number().int().min(1).max(10),
	understanding: z.number().int().min(1).max(10),
	novelty: z.number().int().min(1).max(10),
	importance: z.number().int().min(1).max(10),
	comment: z.string().max(1000).optional(),
});

const UpdateRatingSchema = z.object({
	practicalValue: z.number().int().min(1).max(10).optional(),
	technicalDepth: z.number().int().min(1).max(10).optional(),
	understanding: z.number().int().min(1).max(10).optional(),
	novelty: z.number().int().min(1).max(10).optional(),
	importance: z.number().int().min(1).max(10).optional(),
	comment: z.string().max(1000).optional(),
});

const RatingsQuerySchema = z.object({
	sortBy: z
		.enum([
			"totalScore",
			"createdAt",
			"practicalValue",
			"technicalDepth",
			"understanding",
			"novelty",
			"importance",
		])
		.optional(),
	order: z.enum(["asc", "desc"]).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	offset: z.coerce.number().int().min(0).optional(),
	minScore: z.coerce.number().min(1.0).max(10.0).optional(),
	maxScore: z.coerce.number().min(1.0).max(10.0).optional(),
	hasComment: z.coerce.boolean().optional(),
});

export const createRatingsRouter = (ratingService: IRatingService) => {
	const app = new Hono();

	// POST /api/bookmarks/:id/rating - 評価作成
	app.post("/bookmarks/:id/rating", async (c) => {
		try {
			const articleId = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(articleId)) {
				throw new BadRequestError("無効な記事IDです");
			}

			const body = await c.req.json();
			const validationResult = CreateRatingSchema.safeParse(body);

			if (!validationResult.success) {
				throw new ValidationError("リクエストデータが不正です");
			}

			const rating = await ratingService.createRating(
				articleId,
				validationResult.data,
			);

			return c.json(
				{
					success: true,
					rating,
					message: "記事の評価を作成しました",
				},
				201,
			);
		} catch (error) {
			console.error("Failed to create rating:", error);

			// エラーの詳細情報をログに記録
			if (error instanceof Error) {
				console.error("Error details:", {
					name: error.name,
					message: error.message,
					stack: error.stack,
				});
			}

			// エラーを適切な例外クラスに変換
			if (
				error instanceof Error &&
				!(error instanceof BadRequestError) &&
				!(error instanceof ValidationError)
			) {
				if (error.message.includes("見つかりません")) {
					const notFoundError = new NotFoundError(error.message);
					return c.json(createErrorResponseBody(notFoundError), 404);
				}
				if (error.message.includes("既に評価が存在")) {
					const conflictError = new ConflictError(error.message);
					return c.json(createErrorResponseBody(conflictError), 409);
				}
				if (
					error.message.includes("評価スコアは") ||
					error.message.includes("コメントは")
				) {
					const badRequestError = new BadRequestError(error.message);
					return c.json(createErrorResponseBody(badRequestError), 400);
				}
				if (
					error.message.includes("FOREIGN KEY constraint") ||
					error.message.includes("SQLITE_CONSTRAINT")
				) {
					const notFoundError = new NotFoundError("記事が見つかりません");
					return c.json(createErrorResponseBody(notFoundError), 404);
				}
			}

			const errorResponse = createErrorResponse(error);
			return c.json(createErrorResponseBody(error), errorResponse.statusCode);
		}
	});

	// GET /api/bookmarks/:id/rating - 評価取得
	app.get("/bookmarks/:id/rating", async (c) => {
		try {
			const articleId = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(articleId)) {
				throw new BadRequestError("無効な記事IDです");
			}

			const rating = await ratingService.getRating(articleId);

			if (!rating) {
				return c.json(
					{
						success: false,
						message: "指定された記事の評価が見つかりません",
					},
					404,
				);
			}

			return c.json({
				success: true,
				rating,
			});
		} catch (error) {
			console.error("Failed to get rating:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(createErrorResponseBody(error), errorResponse.statusCode);
		}
	});

	// PATCH /api/bookmarks/:id/rating - 評価更新
	app.patch("/bookmarks/:id/rating", async (c) => {
		try {
			const articleId = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(articleId)) {
				throw new BadRequestError("無効な記事IDです");
			}

			const body = await c.req.json();
			const validationResult = UpdateRatingSchema.safeParse(body);

			if (!validationResult.success) {
				throw new ValidationError("リクエストデータが不正です");
			}

			const rating = await ratingService.updateRating(
				articleId,
				validationResult.data,
			);

			return c.json({
				success: true,
				rating,
				message: "記事の評価を更新しました",
			});
		} catch (error) {
			console.error("Failed to update rating:", error);

			// エラーの詳細情報をログに記録
			if (error instanceof Error) {
				console.error("Error details:", {
					name: error.name,
					message: error.message,
					stack: error.stack,
				});
			}

			// エラーを適切な例外クラスに変換
			if (
				error instanceof Error &&
				!(error instanceof BadRequestError) &&
				!(error instanceof ValidationError)
			) {
				if (error.message.includes("見つかりません")) {
					const notFoundError = new NotFoundError(error.message);
					return c.json(createErrorResponseBody(notFoundError), 404);
				}
				if (error.message.includes("更新するデータが指定されていません")) {
					const badRequestError = new BadRequestError(error.message);
					return c.json(createErrorResponseBody(badRequestError), 400);
				}
				if (
					error.message.includes("評価スコアは") ||
					error.message.includes("コメントは")
				) {
					const badRequestError = new BadRequestError(error.message);
					return c.json(createErrorResponseBody(badRequestError), 400);
				}
				if (
					error.message.includes("FOREIGN KEY constraint") ||
					error.message.includes("SQLITE_CONSTRAINT")
				) {
					const notFoundError = new NotFoundError("記事が見つかりません");
					return c.json(createErrorResponseBody(notFoundError), 404);
				}
			}

			const errorResponse = createErrorResponse(error);
			return c.json(createErrorResponseBody(error), errorResponse.statusCode);
		}
	});

	// DELETE /api/bookmarks/:id/rating - 評価削除
	app.delete("/bookmarks/:id/rating", async (c) => {
		try {
			const articleId = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(articleId)) {
				throw new BadRequestError("無効な記事IDです");
			}

			await ratingService.deleteRating(articleId);

			return c.json({
				success: true,
				message: "記事の評価を削除しました",
			});
		} catch (error) {
			console.error("Failed to delete rating:", error);

			// エラーの詳細情報をログに記録
			if (error instanceof Error) {
				console.error("Error details:", {
					name: error.name,
					message: error.message,
					stack: error.stack,
				});
			}

			// エラーを適切な例外クラスに変換
			if (error instanceof Error && !(error instanceof BadRequestError)) {
				if (error.message.includes("見つかりません")) {
					const notFoundError = new NotFoundError(error.message);
					return c.json(createErrorResponseBody(notFoundError), 404);
				}
				if (
					error.message.includes("FOREIGN KEY constraint") ||
					error.message.includes("SQLITE_CONSTRAINT")
				) {
					const notFoundError = new NotFoundError("記事が見つかりません");
					return c.json(createErrorResponseBody(notFoundError), 404);
				}
			}

			const errorResponse = createErrorResponse(error);
			return c.json(createErrorResponseBody(error), errorResponse.statusCode);
		}
	});

	// GET /api/ratings - 評価一覧取得
	app.get("/ratings", async (c) => {
		try {
			const queryParams = c.req.query();
			const validationResult = RatingsQuerySchema.safeParse(queryParams);

			if (!validationResult.success) {
				throw new ValidationError("クエリパラメータが不正です");
			}

			const ratings = await ratingService.getRatings(validationResult.data);

			return c.json({
				success: true,
				ratings,
				count: ratings.length,
			});
		} catch (error) {
			console.error("Failed to get ratings:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(createErrorResponseBody(error), errorResponse.statusCode);
		}
	});

	// GET /api/ratings/stats - 評価統計情報取得
	app.get("/ratings/stats", async (c) => {
		try {
			const stats = await ratingService.getRatingStats();

			return c.json({
				success: true,
				stats,
			});
		} catch (error) {
			console.error("Failed to get rating stats:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(createErrorResponseBody(error), errorResponse.statusCode);
		}
	});

	return app;
};
