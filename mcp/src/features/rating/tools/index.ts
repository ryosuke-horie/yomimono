/**
 * 記事評価機能のMCPツール定義
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as ratingService from "../services/ratingService.js";
import { RatingFilterParamsSchema } from "../types.js";

/**
 * 評価関連のMCPツールを登録する
 * @param server MCPサーバーインスタンス
 */
export function registerRatingTools(server: McpServer) {
	// 1. 記事評価を作成
	server.tool(
		"createArticleRating",
		{
			articleId: z.number().int().positive(),
			practicalValue: z.number().int().min(1).max(10),
			technicalDepth: z.number().int().min(1).max(10),
			understanding: z.number().int().min(1).max(10),
			novelty: z.number().int().min(1).max(10),
			importance: z.number().int().min(1).max(10),
			comment: z.string().optional(),
		},
		async (input) => {
			try {
				const rating = await ratingService.createArticleRating(input);
				return {
					content: [
						{
							type: "text",
							text: `Successfully created rating for article ID ${input.articleId} with total score ${rating.totalScore}.`,
						},
					],
					isError: false,
				};
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				return {
					content: [
						{
							type: "text",
							text: `Error creating article rating: ${errorMessage}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	// 2. 記事評価を取得
	server.tool(
		"getArticleRating",
		{
			articleId: z.number().int().positive(),
		},
		async ({ articleId }) => {
			try {
				const rating = await ratingService.getArticleRating(articleId);
				return {
					content: [{ type: "text", text: JSON.stringify(rating, null, 2) }],
					isError: false,
				};
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				return {
					content: [
						{
							type: "text",
							text: `Error fetching article rating: ${errorMessage}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	// 3. 記事評価を更新
	server.tool(
		"updateArticleRating",
		{
			articleId: z.number().int().positive(),
			practicalValue: z.number().int().min(1).max(10).optional(),
			technicalDepth: z.number().int().min(1).max(10).optional(),
			understanding: z.number().int().min(1).max(10).optional(),
			novelty: z.number().int().min(1).max(10).optional(),
			importance: z.number().int().min(1).max(10).optional(),
			comment: z.string().optional(),
		},
		async ({ articleId, ...updateData }) => {
			try {
				const rating = await ratingService.updateArticleRating(
					articleId,
					updateData,
				);
				return {
					content: [
						{
							type: "text",
							text: `Successfully updated rating for article ID ${articleId}. New total score: ${rating.totalScore}.`,
						},
					],
					isError: false,
				};
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				return {
					content: [
						{
							type: "text",
							text: `Error updating article rating: ${errorMessage}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	// 4. 記事評価一覧を取得（フィルター・ソート対応）
	server.tool(
		"getArticleRatings",
		RatingFilterParamsSchema.shape,
		async (params) => {
			try {
				const ratings = await ratingService.getArticleRatings(params);
				return {
					content: [{ type: "text", text: JSON.stringify(ratings, null, 2) }],
					isError: false,
				};
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				return {
					content: [
						{
							type: "text",
							text: `Error fetching article ratings: ${errorMessage}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	// 5. 評価統計情報を取得
	server.tool("getRatingStats", {}, async () => {
		try {
			const stats = await ratingService.getRatingStats();
			return {
				content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			return {
				content: [
					{
						type: "text",
						text: `Error fetching rating stats: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	});

	// 6. 高評価記事Top取得
	server.tool(
		"getTopRatedArticles",
		{
			limit: z.number().int().positive().max(50).default(10),
		},
		async ({ limit }) => {
			try {
				const articles = await ratingService.getTopRatedArticles(limit);
				return {
					content: [{ type: "text", text: JSON.stringify(articles, null, 2) }],
					isError: false,
				};
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				return {
					content: [
						{
							type: "text",
							text: `Error fetching top rated articles: ${errorMessage}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	// 7. 一括評価
	server.tool(
		"bulkRateArticles",
		{
			ratings: z
				.array(
					z.object({
						articleId: z.number().int().positive(),
						practicalValue: z.number().int().min(1).max(10),
						technicalDepth: z.number().int().min(1).max(10),
						understanding: z.number().int().min(1).max(10),
						novelty: z.number().int().min(1).max(10),
						importance: z.number().int().min(1).max(10),
						comment: z.string().optional(),
					}),
				)
				.max(10),
		},
		async ({ ratings }) => {
			try {
				const results = await ratingService.bulkRateArticles(ratings);
				const successCount = results.filter((r) => r.success).length;
				const failedCount = results.filter((r) => !r.success).length;

				return {
					content: [
						{
							type: "text",
							text: `Bulk rating completed. Success: ${successCount}, Failed: ${failedCount}\n${JSON.stringify(results, null, 2)}`,
						},
					],
					isError: false,
				};
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				return {
					content: [
						{
							type: "text",
							text: `Error bulk rating articles: ${errorMessage}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
