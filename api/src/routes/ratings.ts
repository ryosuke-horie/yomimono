/**
 * 記事評価ポイントのルーター実装
 */
import { Hono } from "hono";
import { z } from "zod";
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
				return c.json(
					{
						success: false,
						message: "無効な記事IDです",
					},
					400,
				);
			}

			const body = await c.req.json();
			const validationResult = CreateRatingSchema.safeParse(body);

			if (!validationResult.success) {
				return c.json(
					{
						success: false,
						message: "リクエストデータが不正です",
						errors: validationResult.error.issues,
					},
					400,
				);
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

			const message =
				error instanceof Error ? error.message : "評価の作成に失敗しました";

			// より詳細なエラー分類
			let status = 500;
			if (error instanceof Error) {
				if (error.message.includes("見つかりません")) {
					status = 404;
				} else if (error.message.includes("既に評価が存在")) {
					status = 409; // Conflict
				} else if (
					error.message.includes("評価スコアは") ||
					error.message.includes("コメントは")
				) {
					status = 400; // Bad Request
				} else if (
					error.message.includes("FOREIGN KEY constraint") ||
					error.message.includes("SQLITE_CONSTRAINT")
				) {
					// 外部キー制約エラーの場合は404として扱う
					status = 404;
				}
			}

			return c.json(
				{
					success: false,
					message,
				},
				status,
			);
		}
	});

	// GET /api/bookmarks/:id/rating - 評価取得
	app.get("/bookmarks/:id/rating", async (c) => {
		try {
			const articleId = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(articleId)) {
				return c.json(
					{
						success: false,
						message: "無効な記事IDです",
					},
					400,
				);
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
			return c.json(
				{
					success: false,
					message: "評価の取得に失敗しました",
				},
				500,
			);
		}
	});

	// PATCH /api/bookmarks/:id/rating - 評価更新
	app.patch("/bookmarks/:id/rating", async (c) => {
		try {
			const articleId = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(articleId)) {
				return c.json(
					{
						success: false,
						message: "無効な記事IDです",
					},
					400,
				);
			}

			const body = await c.req.json();
			const validationResult = UpdateRatingSchema.safeParse(body);

			if (!validationResult.success) {
				return c.json(
					{
						success: false,
						message: "リクエストデータが不正です",
						errors: validationResult.error.issues,
					},
					400,
				);
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

			const message =
				error instanceof Error ? error.message : "評価の更新に失敗しました";

			// より詳細なエラー分類
			let status = 500;
			if (error instanceof Error) {
				if (error.message.includes("見つかりません")) {
					status = 404;
				} else if (
					error.message.includes("更新するデータが指定されていません")
				) {
					status = 400; // Bad Request
				} else if (
					error.message.includes("評価スコアは") ||
					error.message.includes("コメントは")
				) {
					status = 400; // Bad Request
				} else if (
					error.message.includes("FOREIGN KEY constraint") ||
					error.message.includes("SQLITE_CONSTRAINT")
				) {
					// 外部キー制約エラーの場合は404として扱う
					status = 404;
				}
			}

			return c.json(
				{
					success: false,
					message,
				},
				status,
			);
		}
	});

	// DELETE /api/bookmarks/:id/rating - 評価削除
	app.delete("/bookmarks/:id/rating", async (c) => {
		try {
			const articleId = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(articleId)) {
				return c.json(
					{
						success: false,
						message: "無効な記事IDです",
					},
					400,
				);
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

			const message =
				error instanceof Error ? error.message : "評価の削除に失敗しました";

			// より詳細なエラー分類
			let status = 500;
			if (error instanceof Error) {
				if (error.message.includes("見つかりません")) {
					status = 404;
				} else if (
					error.message.includes("FOREIGN KEY constraint") ||
					error.message.includes("SQLITE_CONSTRAINT")
				) {
					// 外部キー制約エラーの場合は404として扱う
					status = 404;
				}
			}

			return c.json(
				{
					success: false,
					message,
				},
				status,
			);
		}
	});

	// GET /api/ratings - 評価一覧取得
	app.get("/ratings", async (c) => {
		try {
			const queryParams = c.req.query();
			const validationResult = RatingsQuerySchema.safeParse(queryParams);

			if (!validationResult.success) {
				return c.json(
					{
						success: false,
						message: "クエリパラメータが不正です",
						errors: validationResult.error.issues,
					},
					400,
				);
			}

			const ratings = await ratingService.getRatings(validationResult.data);

			return c.json({
				success: true,
				ratings,
				count: ratings.length,
			});
		} catch (error) {
			console.error("Failed to get ratings:", error);
			const message =
				error instanceof Error ? error.message : "評価一覧の取得に失敗しました";
			return c.json(
				{
					success: false,
					message,
				},
				500,
			);
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
			return c.json(
				{
					success: false,
					message: "評価統計情報の取得に失敗しました",
				},
				500,
			);
		}
	});

	return app;
};
