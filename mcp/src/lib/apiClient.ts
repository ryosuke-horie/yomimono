/**
 * 後方互換性のための一時的なAPIクライアント
 * テストファイルの移行完了後に削除予定
 */

// APIクライアント機能をサービス層から再エクスポート（テスト互換性のため）
export {
	getUnlabeledArticles,
	getLabels,
	assignLabelToArticle,
	createLabel,
	getLabelById,
	deleteLabel,
	updateLabelDescription,
	assignLabelsToMultipleArticles,
} from "../features/label/services/labelService.js";

export {
	getBookmarkById,
	getUnreadArticlesByLabel,
	getUnreadBookmarks,
	getReadBookmarks,
	markBookmarkAsRead,
	getUnratedArticles,
} from "../features/bookmark/services/bookmarkService.js";

// Rating functions with compatibility wrappers
import * as ratingService from "../features/rating/services/ratingService.js";
import type { CreateRatingInput, UpdateRatingInput, RatingFilterParams } from "../features/rating/types.js";

// Compatibility wrapper for createArticleRating
export async function createArticleRating(
	articleId: number,
	ratingData: Omit<CreateRatingInput, 'articleId'>
) {
	const input: CreateRatingInput = {
		articleId,
		...ratingData,
	};
	return ratingService.createArticleRating(input);
}

// Compatibility wrapper for updateArticleRating  
export async function updateArticleRating(
	articleId: number,
	updateData: UpdateRatingInput
) {
	return ratingService.updateArticleRating(articleId, updateData);
}

// Direct exports for functions that don't need compatibility changes
export const getArticleRating = ratingService.getArticleRating;
export const deleteArticleRating = ratingService.deleteArticleRating;
export const getRatingStats = ratingService.getRatingStats;
export const getTopRatedArticles = ratingService.getTopRatedArticles;

// Compatibility wrapper for getArticleRatings
export async function getArticleRatings(options?: RatingFilterParams) {
	return ratingService.getArticleRatings(options);
}

// Compatibility wrapper for bulkRateArticles
export async function bulkRateArticles(ratings: Array<{ articleId: number } & Omit<CreateRatingInput, 'articleId'>>) {
	const convertedRatings: CreateRatingInput[] = ratings.map(rating => ({
		articleId: rating.articleId,
		practicalValue: rating.practicalValue,
		technicalDepth: rating.technicalDepth,
		understanding: rating.understanding,
		novelty: rating.novelty,
		importance: rating.importance,
		comment: rating.comment,
	}));
	return ratingService.bulkRateArticles(convertedRatings);
}

// 型定義の再エクスポート
export type {
	Label,
	Article,
} from "../features/label/types.js";

export type {
	Bookmark,
} from "../features/bookmark/types.js";

export type {
	ArticleRating,
	CreateRatingInput,
	UpdateRatingInput,
	RatingFilterParams,
	RatingStats,
} from "../features/rating/types.js";

// 従来のテストで使用されていた可能性のある型の別名
export type { Article as BookmarkWithLabel } from "../features/label/types.js";
export type { CreateRatingInput as CreateRatingData } from "../features/rating/types.js";
export type { UpdateRatingInput as UpdateRatingData } from "../features/rating/types.js";
export type { RatingFilterParams as GetRatingsOptions } from "../features/rating/types.js";