/**
 * 記事評価ポイントのリポジトリインターフェース
 */
import type { ArticleRating, InsertArticleRating } from "../../db/schema";

export interface IArticleRatingRepository {
	/**
	 * 記事の評価を作成する
	 */
	create(rating: InsertArticleRating): Promise<ArticleRating>;

	/**
	 * 記事IDによる評価取得
	 */
	findByArticleId(articleId: number): Promise<ArticleRating | null>;

	/**
	 * 記事の評価を更新する
	 */
	update(
		articleId: number,
		rating: Partial<InsertArticleRating>,
	): Promise<ArticleRating | null>;

	/**
	 * 記事の評価を削除する
	 */
	delete(articleId: number): Promise<boolean>;

	/**
	 * 評価一覧を取得する（ソート・フィルター対応）
	 */
	findMany(options: FindManyOptions): Promise<ArticleRating[]>;

	/**
	 * 評価統計情報を取得する
	 */
	getStats(): Promise<RatingStats>;
}

export interface FindManyOptions {
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
