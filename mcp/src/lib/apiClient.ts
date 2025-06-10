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

export {
	createArticleRating,
	getArticleRating,
	updateArticleRating,
	deleteArticleRating,
	getArticleRatings,
	getRatingStats,
	getTopRatedArticles,
	bulkRateArticles,
} from "../features/rating/services/ratingService.js";

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