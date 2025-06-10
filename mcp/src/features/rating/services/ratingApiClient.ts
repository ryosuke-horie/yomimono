/**
 * 記事評価機能のAPI通信を担当するクライアント
 */

import { z } from "zod";
import { getApiBaseUrl } from "../../../lib/api/config.js";
import {
	ArticleRatingSchema,
	type CreateRatingInput,
	type RatingFilterParams,
	RatingStatsSchema,
	type UpdateRatingInput,
} from "../types.js";

const apiBaseUrl = getApiBaseUrl();

/**
 * APIレスポンスの共通エラーハンドリング
 */
async function handleApiResponse(response: Response) {
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`API request failed: ${response.status} ${response.statusText} - ${errorText}`,
		);
	}
}

/**
 * 記事評価を作成
 */
export async function createArticleRating(input: CreateRatingInput) {
	const response = await fetch(`${apiBaseUrl}/ratings`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
	});
	await handleApiResponse(response);

	const data = await response.json();
	return ArticleRatingSchema.parse(data);
}

/**
 * 記事評価を取得
 */
export async function getArticleRating(articleId: number) {
	const response = await fetch(`${apiBaseUrl}/ratings/article/${articleId}`);
	await handleApiResponse(response);

	const data = await response.json();
	return ArticleRatingSchema.parse(data);
}

/**
 * 記事評価を更新
 */
export async function updateArticleRating(
	articleId: number,
	input: UpdateRatingInput,
) {
	const response = await fetch(`${apiBaseUrl}/ratings/article/${articleId}`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
	});
	await handleApiResponse(response);

	const data = await response.json();
	return ArticleRatingSchema.parse(data);
}

/**
 * 記事評価を削除
 */
export async function deleteArticleRating(articleId: number) {
	const response = await fetch(`${apiBaseUrl}/ratings/article/${articleId}`, {
		method: "DELETE",
	});
	await handleApiResponse(response);
}

/**
 * 記事評価一覧を取得（フィルター・ソート対応）
 */
export async function getArticleRatings(params?: RatingFilterParams) {
	const queryParams = new URLSearchParams();

	if (params) {
		if (params.minScore !== undefined)
			queryParams.append("minScore", params.minScore.toString());
		if (params.maxScore !== undefined)
			queryParams.append("maxScore", params.maxScore.toString());
		if (params.hasComment !== undefined)
			queryParams.append("hasComment", params.hasComment.toString());
		if (params.sortBy) queryParams.append("sortBy", params.sortBy);
		if (params.order) queryParams.append("order", params.order);
		if (params.limit !== undefined)
			queryParams.append("limit", params.limit.toString());
		if (params.offset !== undefined)
			queryParams.append("offset", params.offset.toString());
	}

	const url = `${apiBaseUrl}/ratings${
		queryParams.toString() ? `?${queryParams.toString()}` : ""
	}`;
	const response = await fetch(url);
	await handleApiResponse(response);

	const data = await response.json();
	return z.array(ArticleRatingSchema).parse(data);
}

/**
 * 評価統計情報を取得
 */
export async function getRatingStats() {
	const response = await fetch(`${apiBaseUrl}/ratings/stats`);
	await handleApiResponse(response);

	const data = await response.json();
	return RatingStatsSchema.parse(data);
}

/**
 * 高評価記事Top取得
 */
export async function getTopRatedArticles(limit = 10) {
	const response = await fetch(
		`${apiBaseUrl}/ratings/top?limit=${Math.min(limit, 50)}`,
	);
	await handleApiResponse(response);

	const data = await response.json();
	return z.array(ArticleRatingSchema).parse(data);
}

/**
 * 一括評価
 */
export async function bulkRateArticles(ratings: CreateRatingInput[]) {
	if (ratings.length > 10) {
		throw new Error("一度に評価できる記事は最大10件です");
	}

	const response = await fetch(`${apiBaseUrl}/ratings/bulk`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ ratings }),
	});
	await handleApiResponse(response);

	const data = await response.json();
	return z
		.array(
			z.object({
				success: z.boolean(),
				articleId: z.number(),
				rating: ArticleRatingSchema.optional(),
				error: z.string().optional(),
			}),
		)
		.parse(data);
}
