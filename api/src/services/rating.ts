/**
 * 記事評価ポイントのサービス実装
 */
import type { ArticleRating } from "../db/schema";
import {
	ConflictError,
	InternalServerError,
	NotFoundError,
	ValidationError,
} from "../exceptions";
import type {
	FindManyOptions,
	IArticleRatingRepository,
	RatingStats,
} from "../interfaces/repository/articleRating";
import type { IBookmarkRepository } from "../interfaces/repository/bookmark";
import type {
	CreateRatingData,
	IRatingService,
	UpdateRatingData,
} from "../interfaces/service/rating";

export class DefaultRatingService implements IRatingService {
	constructor(
		private readonly repository: IArticleRatingRepository,
		private readonly bookmarkRepository: IBookmarkRepository,
	) {}

	async createRating(
		articleId: number,
		ratingData: CreateRatingData,
	): Promise<ArticleRating> {
		try {
			// 記事が存在するかチェック
			const article = await this.bookmarkRepository.findById(articleId);
			if (!article) {
				throw new NotFoundError("指定された記事が見つかりません");
			}

			// 既存の評価が存在するかチェック
			const existingRating = await this.repository.findByArticleId(articleId);
			if (existingRating) {
				throw new ConflictError("この記事には既に評価が存在します");
			}

			// 評価データの検証
			this.validateRatingData(ratingData);

			const insertData = {
				articleId,
				practicalValue: ratingData.practicalValue,
				technicalDepth: ratingData.technicalDepth,
				understanding: ratingData.understanding,
				novelty: ratingData.novelty,
				importance: ratingData.importance,
				comment: ratingData.comment,
				totalScore: 0, // リポジトリ層で計算される
			};

			return await this.repository.create(insertData);
		} catch (error) {
			console.error("Failed to create rating:", error);
			throw error;
		}
	}

	async getRating(articleId: number): Promise<ArticleRating | null> {
		try {
			return await this.repository.findByArticleId(articleId);
		} catch (error) {
			console.error("Failed to get rating:", error);
			throw error;
		}
	}

	async updateRating(
		articleId: number,
		ratingData: UpdateRatingData,
	): Promise<ArticleRating> {
		try {
			// 記事が存在するかチェック
			const article = await this.bookmarkRepository.findById(articleId);
			if (!article) {
				throw new NotFoundError("指定された記事が見つかりません");
			}

			// 既存の評価が存在するかチェック
			const existingRating = await this.repository.findByArticleId(articleId);
			if (!existingRating) {
				throw new NotFoundError("指定された記事の評価が見つかりません");
			}

			// 更新データの検証
			this.validateUpdateRatingData(ratingData);

			const result = await this.repository.update(articleId, ratingData);
			if (!result) {
				throw new InternalServerError("評価の更新に失敗しました");
			}

			return result;
		} catch (error) {
			console.error("Failed to update rating:", error);
			throw error;
		}
	}

	async deleteRating(articleId: number): Promise<void> {
		try {
			// 記事が存在するかチェック
			const article = await this.bookmarkRepository.findById(articleId);
			if (!article) {
				throw new NotFoundError("指定された記事が見つかりません");
			}

			// 既存の評価が存在するかチェック
			const existingRating = await this.repository.findByArticleId(articleId);
			if (!existingRating) {
				throw new NotFoundError("指定された記事の評価が見つかりません");
			}

			const deleted = await this.repository.delete(articleId);
			if (!deleted) {
				throw new InternalServerError("評価の削除に失敗しました");
			}
		} catch (error) {
			console.error("Failed to delete rating:", error);
			throw error;
		}
	}

	async getRatings(options?: FindManyOptions): Promise<ArticleRating[]> {
		try {
			// オプションの検証とデフォルト値設定
			const validatedOptions = this.validateFindManyOptions(options);
			return await this.repository.findMany(validatedOptions);
		} catch (error) {
			console.error("Failed to get ratings:", error);
			throw error;
		}
	}

	async getRatingStats(): Promise<RatingStats> {
		try {
			return await this.repository.getStats();
		} catch (error) {
			console.error("Failed to get rating stats:", error);
			throw error;
		}
	}

	/**
	 * 評価データのバリデーション
	 */
	private validateRatingData(data: CreateRatingData): void {
		const {
			practicalValue,
			technicalDepth,
			understanding,
			novelty,
			importance,
			comment,
		} = data;

		// スコアの範囲チェック (1-10)
		const scores = [
			practicalValue,
			technicalDepth,
			understanding,
			novelty,
			importance,
		];
		for (const score of scores) {
			if (!Number.isInteger(score) || score < 1 || score > 10) {
				throw new ValidationError(
					"評価スコアは1から10の整数である必要があります",
				);
			}
		}

		// コメントの文字数チェック
		if (comment && comment.length > 1000) {
			throw new ValidationError("コメントは1000文字以内で入力してください");
		}
	}

	/**
	 * 更新用評価データのバリデーション
	 */
	private validateUpdateRatingData(data: UpdateRatingData): void {
		const {
			practicalValue,
			technicalDepth,
			understanding,
			novelty,
			importance,
			comment,
		} = data;

		// 少なくとも1つのフィールドが更新される必要がある
		if (
			practicalValue === undefined &&
			technicalDepth === undefined &&
			understanding === undefined &&
			novelty === undefined &&
			importance === undefined &&
			comment === undefined
		) {
			throw new ValidationError("更新するデータが指定されていません");
		}

		// 指定されたスコアの範囲チェック
		const scores = [
			practicalValue,
			technicalDepth,
			understanding,
			novelty,
			importance,
		];
		for (const score of scores) {
			if (
				score !== undefined &&
				(!Number.isInteger(score) || score < 1 || score > 10)
			) {
				throw new ValidationError(
					"評価スコアは1から10の整数である必要があります",
				);
			}
		}

		// コメントの文字数チェック
		if (comment !== undefined && comment.length > 1000) {
			throw new ValidationError("コメントは1000文字以内で入力してください");
		}
	}

	/**
	 * 検索オプションのバリデーション
	 */
	private validateFindManyOptions(options?: FindManyOptions): FindManyOptions {
		if (!options) {
			return {
				sortBy: "createdAt",
				order: "desc",
				limit: 20,
				offset: 0,
			};
		}

		const validSortColumns = [
			"totalScore",
			"createdAt",
			"practicalValue",
			"technicalDepth",
			"understanding",
			"novelty",
			"importance",
		];

		const validatedOptions: FindManyOptions = {
			sortBy: validSortColumns.includes(options.sortBy || "")
				? options.sortBy
				: "createdAt",
			order: options.order === "asc" ? "asc" : "desc",
			limit: Math.min(Math.max(options.limit || 20, 1), 100), // 1-100の範囲
			offset: Math.max(options.offset || 0, 0),
		};

		// スコア範囲の検証
		if (options.minScore !== undefined) {
			if (options.minScore < 1.0 || options.minScore > 10.0) {
				throw new ValidationError(
					"最小スコアは1.0から10.0の範囲で指定してください",
				);
			}
			validatedOptions.minScore = options.minScore;
		}

		if (options.maxScore !== undefined) {
			if (options.maxScore < 1.0 || options.maxScore > 10.0) {
				throw new ValidationError(
					"最大スコアは1.0から10.0の範囲で指定してください",
				);
			}
			validatedOptions.maxScore = options.maxScore;
		}

		if (
			options.minScore !== undefined &&
			options.maxScore !== undefined &&
			options.minScore > options.maxScore
		) {
			throw new ValidationError(
				"最小スコアは最大スコア以下である必要があります",
			);
		}

		if (options.hasComment !== undefined) {
			validatedOptions.hasComment = options.hasComment;
		}

		return validatedOptions;
	}
}
