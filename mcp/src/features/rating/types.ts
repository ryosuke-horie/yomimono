/**
 * 記事評価機能で使用する型定義
 */

import { z } from "zod";

/**
 * 記事評価のスキーマ定義
 */
export const ArticleRatingSchema = z.object({
	id: z.number(),
	articleId: z.number(),
	practicalValue: z.number(),
	technicalDepth: z.number(),
	understanding: z.number(),
	novelty: z.number(),
	importance: z.number(),
	totalScore: z.number(),
	comment: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

/**
 * 記事評価型
 */
export type ArticleRating = z.infer<typeof ArticleRatingSchema>;

/**
 * 記事評価作成時の入力スキーマ
 */
export const CreateRatingInputSchema = z.object({
	articleId: z.number().int().positive(),
	practicalValue: z.number().int().min(1).max(10),
	technicalDepth: z.number().int().min(1).max(10),
	understanding: z.number().int().min(1).max(10),
	novelty: z.number().int().min(1).max(10),
	importance: z.number().int().min(1).max(10),
	comment: z.string().optional(),
});

/**
 * 記事評価作成時の入力型
 */
export type CreateRatingInput = z.infer<typeof CreateRatingInputSchema>;

/**
 * 記事評価更新時の入力スキーマ
 */
export const UpdateRatingInputSchema = z.object({
	practicalValue: z.number().int().min(1).max(10).optional(),
	technicalDepth: z.number().int().min(1).max(10).optional(),
	understanding: z.number().int().min(1).max(10).optional(),
	novelty: z.number().int().min(1).max(10).optional(),
	importance: z.number().int().min(1).max(10).optional(),
	comment: z.string().optional(),
});

/**
 * 記事評価更新時の入力型
 */
export type UpdateRatingInput = z.infer<typeof UpdateRatingInputSchema>;

/**
 * 評価統計情報のスキーマ
 */
export const RatingStatsSchema = z.object({
	totalRatings: z.number(),
	averageScores: z.object({
		practicalValue: z.number(),
		technicalDepth: z.number(),
		understanding: z.number(),
		novelty: z.number(),
		importance: z.number(),
		totalScore: z.number(),
	}),
	scoreDistribution: z.record(z.number()),
});

/**
 * 評価統計情報型
 */
export type RatingStats = z.infer<typeof RatingStatsSchema>;

/**
 * 評価フィルターパラメータのスキーマ
 */
export const RatingFilterParamsSchema = z.object({
	minScore: z.number().min(1).max(10).optional(),
	maxScore: z.number().min(1).max(10).optional(),
	hasComment: z.boolean().optional(),
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
	limit: z.number().int().positive().max(100).optional(),
	offset: z.number().int().min(0).optional(),
});

/**
 * 評価フィルターパラメータ型
 */
export type RatingFilterParams = z.infer<typeof RatingFilterParamsSchema>;
