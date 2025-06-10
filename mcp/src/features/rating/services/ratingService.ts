/**
 * 記事評価機能のビジネスロジックを提供するサービス層
 */

import type {
	ArticleRating,
	CreateRatingInput,
	RatingFilterParams,
	RatingStats,
	UpdateRatingInput,
} from "../types.js";
import * as ratingApi from "./ratingApiClient.js";

/**
 * 記事評価を作成する
 * @param input 評価作成パラメータ
 * @returns 作成された評価
 */
export async function createArticleRating(
	input: CreateRatingInput,
): Promise<ArticleRating> {
	try {
		return await ratingApi.createArticleRating(input);
	} catch (error) {
		console.error("Failed to create article rating:", error);
		throw new Error(`記事ID ${input.articleId} の評価作成に失敗しました`);
	}
}

/**
 * 記事評価を取得する
 * @param articleId 記事ID
 * @returns 記事評価
 */
export async function getArticleRating(
	articleId: number,
): Promise<ArticleRating> {
	try {
		return await ratingApi.getArticleRating(articleId);
	} catch (error) {
		console.error("Failed to get article rating:", error);
		throw new Error(`記事ID ${articleId} の評価取得に失敗しました`);
	}
}

/**
 * 記事評価を更新する
 * @param articleId 記事ID
 * @param input 更新パラメータ
 * @returns 更新された評価
 */
export async function updateArticleRating(
	articleId: number,
	input: UpdateRatingInput,
): Promise<ArticleRating> {
	try {
		return await ratingApi.updateArticleRating(articleId, input);
	} catch (error) {
		console.error("Failed to update article rating:", error);
		throw new Error(`記事ID ${articleId} の評価更新に失敗しました`);
	}
}

/**
 * 記事評価を削除する
 * @param articleId 記事ID
 */
export async function deleteArticleRating(articleId: number): Promise<void> {
	try {
		await ratingApi.deleteArticleRating(articleId);
	} catch (error) {
		console.error("Failed to delete article rating:", error);
		throw new Error(`記事ID ${articleId} の評価削除に失敗しました`);
	}
}

/**
 * 記事評価一覧を取得する（フィルター・ソート対応）
 * @param params フィルター・ソートパラメータ
 * @returns 評価一覧
 */
export async function getArticleRatings(
	params?: RatingFilterParams,
): Promise<ArticleRating[]> {
	try {
		return await ratingApi.getArticleRatings(params);
	} catch (error) {
		console.error("Failed to get article ratings:", error);
		throw new Error("記事評価一覧の取得に失敗しました");
	}
}

/**
 * 評価統計情報を取得する
 * @returns 統計情報
 */
export async function getRatingStats(): Promise<RatingStats> {
	try {
		return await ratingApi.getRatingStats();
	} catch (error) {
		console.error("Failed to get rating stats:", error);
		throw new Error("評価統計情報の取得に失敗しました");
	}
}

/**
 * 高評価記事Top取得する
 * @param limit 取得件数（最大50）
 * @returns 高評価記事一覧
 */
export async function getTopRatedArticles(
	limit = 10,
): Promise<ArticleRating[]> {
	try {
		return await ratingApi.getTopRatedArticles(limit);
	} catch (error) {
		console.error("Failed to get top rated articles:", error);
		throw new Error("高評価記事の取得に失敗しました");
	}
}

/**
 * 複数の記事を一括評価する
 * @param ratings 評価リスト（最大10件）
 * @returns 評価結果
 */
export async function bulkRateArticles(ratings: CreateRatingInput[]) {
	try {
		const results = await ratingApi.bulkRateArticles(ratings);
		const failedCount = results.filter((r) => !r.success).length;
		if (failedCount > 0) {
			console.warn(`${failedCount}件の記事の評価に失敗しました`);
		}
		return results;
	} catch (error) {
		console.error("Failed to bulk rate articles:", error);
		throw new Error("一括評価に失敗しました");
	}
}
