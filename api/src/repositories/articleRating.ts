/**
 * 記事評価ポイントのリポジトリ実装
 */
import {
	type SQL,
	and,
	asc,
	avg,
	count,
	desc,
	eq,
	gte,
	isNotNull,
	isNull,
	lte,
	or,
} from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle } from "drizzle-orm/d1";
import {
	type ArticleRating,
	type InsertArticleRating,
	articleRatings,
	bookmarks,
} from "../db/schema";
import type {
	FindManyOptions,
	IArticleRatingRepository,
	RatingStats,
} from "../interfaces/repository/articleRating";

export class DrizzleArticleRatingRepository
	implements IArticleRatingRepository
{
	private readonly db: DrizzleD1Database;

	constructor(db: D1Database) {
		this.db = drizzle(db);
	}

	async create(rating: InsertArticleRating): Promise<ArticleRating> {
		try {
			// 総合スコア計算（平均値 * 10で整数化）
			const totalScore = Math.round(
				((rating.practicalValue +
					rating.technicalDepth +
					rating.understanding +
					rating.novelty +
					rating.importance) /
					5) *
					10,
			);

			const ratingWithTotalScore = {
				...rating,
				totalScore,
			};

			const result = await this.db
				.insert(articleRatings)
				.values(ratingWithTotalScore)
				.returning();

			if (!result[0]) {
				throw new Error("Failed to create article rating");
			}

			return result[0];
		} catch (error) {
			console.error("Failed to create article rating:", error);

			// 外部キー制約エラーの場合はより分かりやすいメッセージに変換
			if (error instanceof Error) {
				if (
					error.message.includes("FOREIGN KEY constraint") ||
					error.message.includes("SQLITE_CONSTRAINT")
				) {
					throw new Error("指定された記事が見つかりません");
				}
			}

			throw error;
		}
	}

	async findByArticleId(articleId: number): Promise<ArticleRating | null> {
		try {
			const result = await this.db
				.select()
				.from(articleRatings)
				.where(eq(articleRatings.articleId, articleId))
				.limit(1);

			return result[0] || null;
		} catch (error) {
			console.error("Failed to find article rating:", error);
			throw error;
		}
	}

	async update(
		articleId: number,
		rating: Partial<InsertArticleRating>,
	): Promise<ArticleRating | null> {
		try {
			// 現在の評価を取得
			const current = await this.findByArticleId(articleId);
			if (!current) {
				return null;
			}

			// 更新されたスコアで総合スコアを再計算
			const updatedRating = {
				practicalValue: rating.practicalValue ?? current.practicalValue,
				technicalDepth: rating.technicalDepth ?? current.technicalDepth,
				understanding: rating.understanding ?? current.understanding,
				novelty: rating.novelty ?? current.novelty,
				importance: rating.importance ?? current.importance,
			};

			const totalScore = Math.round(
				((updatedRating.practicalValue +
					updatedRating.technicalDepth +
					updatedRating.understanding +
					updatedRating.novelty +
					updatedRating.importance) /
					5) *
					10,
			);

			const updateData = {
				...rating,
				totalScore,
				updatedAt: new Date(),
			};

			const result = await this.db
				.update(articleRatings)
				.set(updateData)
				.where(eq(articleRatings.articleId, articleId))
				.returning();

			return result[0] || null;
		} catch (error) {
			console.error("Failed to update article rating:", error);

			// 外部キー制約エラーの場合はより分かりやすいメッセージに変換
			if (error instanceof Error) {
				if (
					error.message.includes("FOREIGN KEY constraint") ||
					error.message.includes("SQLITE_CONSTRAINT")
				) {
					throw new Error("指定された記事が見つかりません");
				}
			}

			throw error;
		}
	}

	async delete(articleId: number): Promise<boolean> {
		try {
			const result = await this.db
				.delete(articleRatings)
				.where(eq(articleRatings.articleId, articleId))
				.returning();

			return result.length > 0;
		} catch (error) {
			console.error("Failed to delete article rating:", error);

			// 外部キー制約エラーの場合はより分かりやすいメッセージに変換
			if (error instanceof Error) {
				if (
					error.message.includes("FOREIGN KEY constraint") ||
					error.message.includes("SQLITE_CONSTRAINT")
				) {
					throw new Error("指定された記事が見つかりません");
				}
			}

			throw error;
		}
	}

	async findMany(options: FindManyOptions): Promise<ArticleRating[]> {
		try {
			const {
				sortBy = "createdAt",
				order = "desc",
				limit = 20,
				offset = 0,
				minScore,
				maxScore,
				hasComment,
			} = options;

			// WHERE条件を構築
			const conditions: SQL<unknown>[] = [];

			if (minScore !== undefined) {
				conditions.push(
					gte(articleRatings.totalScore, Math.round(minScore * 10)),
				);
			}

			if (maxScore !== undefined) {
				conditions.push(
					lte(articleRatings.totalScore, Math.round(maxScore * 10)),
				);
			}

			if (hasComment !== undefined) {
				if (hasComment) {
					conditions.push(isNotNull(articleRatings.comment));
				} else {
					// SQLでNULLまたは空文字列をチェック（or条件で）
					conditions.push(
						or(isNull(articleRatings.comment), eq(articleRatings.comment, "")),
					);
				}
			}

			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;

			// ソート条件を設定
			const orderBy = order === "asc" ? asc : desc;
			const sortColumn = articleRatings[sortBy];

			const result = await this.db
				.select()
				.from(articleRatings)
				.where(whereClause)
				.orderBy(orderBy(sortColumn))
				.limit(Math.min(limit, 100)) // 最大100件に制限
				.offset(offset);

			return result;
		} catch (error) {
			console.error("Failed to find many article ratings:", error);
			throw error;
		}
	}

	async getStats(): Promise<RatingStats> {
		try {
			const result = await this.db
				.select({
					totalCount: count(),
					averageScore: avg(articleRatings.totalScore),
					averagePracticalValue: avg(articleRatings.practicalValue),
					averageTechnicalDepth: avg(articleRatings.technicalDepth),
					averageUnderstanding: avg(articleRatings.understanding),
					averageNovelty: avg(articleRatings.novelty),
					averageImportance: avg(articleRatings.importance),
				})
				.from(articleRatings);

			const commentsResult = await this.db
				.select({
					ratingsWithComments: count(),
				})
				.from(articleRatings)
				.where(isNotNull(articleRatings.comment));

			const stats = result[0];
			const comments = commentsResult[0];

			return {
				totalCount: stats.totalCount || 0,
				averageScore: stats.averageScore ? Number(stats.averageScore) / 10 : 0, // 整数化された値を元に戻す
				averagePracticalValue: stats.averagePracticalValue
					? Number(stats.averagePracticalValue)
					: 0,
				averageTechnicalDepth: stats.averageTechnicalDepth
					? Number(stats.averageTechnicalDepth)
					: 0,
				averageUnderstanding: stats.averageUnderstanding
					? Number(stats.averageUnderstanding)
					: 0,
				averageNovelty: stats.averageNovelty ? Number(stats.averageNovelty) : 0,
				averageImportance: stats.averageImportance
					? Number(stats.averageImportance)
					: 0,
				ratingsWithComments: comments.ratingsWithComments || 0,
			};
		} catch (error) {
			console.error("Failed to get rating stats:", error);
			throw error;
		}
	}
}
