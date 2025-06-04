/**
 * 記事評価ポイント機能の型定義
 */

export interface ArticleRating {
	id: number;
	articleId: number;
	practicalValue: number; // 実用性 (1-10)
	technicalDepth: number; // 技術深度 (1-10)
	understanding: number; // 理解度 (1-10)
	novelty: number; // 新規性 (1-10)
	importance: number; // 重要度 (1-10)
	totalScore: number; // 総合スコア
	comment?: string; // コメント
	createdAt: string;
	updatedAt: string;
}

export interface BookmarkWithRating {
	id: number;
	url: string;
	title?: string;
	isRead: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface RatingWithArticle {
	rating: ArticleRating;
	article: BookmarkWithRating;
}

export interface RatingFilters {
	sortBy?:
		| "totalScore"
		| "createdAt"
		| "practicalValue"
		| "technicalDepth"
		| "understanding"
		| "novelty"
		| "importance";
	order?: "asc" | "desc";
	limit?: number;
	offset?: number;
	minScore?: number;
	maxScore?: number;
	hasComment?: boolean;
}

export interface RatingStats {
	totalCount: number;
	averageScore: number;
	averagePracticalValue: number;
	averageTechnicalDepth: number;
	averageUnderstanding: number;
	averageNovelty: number;
	averageImportance: number;
	ratingsWithComments: number;
}

export interface CreateRatingData {
	practicalValue: number;
	technicalDepth: number;
	understanding: number;
	novelty: number;
	importance: number;
	comment?: string;
}

export interface UpdateRatingData {
	practicalValue?: number;
	technicalDepth?: number;
	understanding?: number;
	novelty?: number;
	importance?: number;
	comment?: string;
}
