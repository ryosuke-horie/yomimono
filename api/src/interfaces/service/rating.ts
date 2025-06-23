/**
 * 記事評価ポイントのサービスインターフェース
 */
import type { ArticleRating } from "../../db/schema";
import type { FindManyOptions, RatingStats } from "../repository/articleRating";

export interface IRatingService {
	/**
	 * 記事の評価を作成する
	 */
	createRating(
		articleId: number,
		ratingData: CreateRatingData,
	): Promise<ArticleRating>;

	/**
	 * 記事の評価を取得する
	 */
	getRating(articleId: number): Promise<ArticleRating | null>;

	/**
	 * 記事の評価を更新する
	 */
	updateRating(
		articleId: number,
		ratingData: UpdateRatingData,
	): Promise<ArticleRating>;

	/**
	 * 記事の評価を削除する
	 */
	deleteRating(articleId: number): Promise<void>;

	/**
	 * 評価一覧を取得する
	 */
	getRatings(options?: FindManyOptions): Promise<ArticleRating[]>;

	/**
	 * 評価統計情報を取得する
	 */
	getRatingStats(): Promise<RatingStats>;
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
