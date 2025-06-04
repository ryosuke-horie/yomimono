/**
 * 記事評価ポイント機能の型定義のテスト
 */
import { expect, test } from "vitest";
import type {
	ArticleRating,
	CreateRatingData,
	RatingFilters,
	RatingStats,
	RatingWithArticle,
} from "./types";

if (import.meta.vitest) {
	test("ArticleRatingの型が正しく定義されている", () => {
		const rating: ArticleRating = {
			id: 1,
			articleId: 123,
			practicalValue: 8,
			technicalDepth: 7,
			understanding: 9,
			novelty: 6,
			importance: 8,
			totalScore: 76,
			comment: "とても参考になる記事でした",
			createdAt: "2023-01-01T00:00:00Z",
			updatedAt: "2023-01-01T00:00:00Z",
		};

		expect(rating.id).toBe(1);
		expect(rating.articleId).toBe(123);
		expect(rating.totalScore).toBe(76);
	});

	test("RatingFiltersの型が正しく定義されている", () => {
		const filters: RatingFilters = {
			sortBy: "totalScore",
			order: "desc",
			minScore: 5,
			maxScore: 10,
			hasComment: true,
		};

		expect(filters.sortBy).toBe("totalScore");
		expect(filters.order).toBe("desc");
		expect(filters.minScore).toBe(5);
	});

	test("CreateRatingDataの型が正しく定義されている", () => {
		const data: CreateRatingData = {
			practicalValue: 8,
			technicalDepth: 7,
			understanding: 9,
			novelty: 6,
			importance: 8,
			comment: "参考になりました",
		};

		expect(data.practicalValue).toBe(8);
		expect(data.comment).toBe("参考になりました");
	});

	test("RatingStatsの型が正しく定義されている", () => {
		const stats: RatingStats = {
			totalCount: 100,
			averageScore: 7.5,
			averagePracticalValue: 7.8,
			averageTechnicalDepth: 7.2,
			averageUnderstanding: 7.9,
			averageNovelty: 6.5,
			averageImportance: 7.6,
			ratingsWithComments: 80,
		};

		expect(stats.totalCount).toBe(100);
		expect(stats.averageScore).toBe(7.5);
		expect(stats.ratingsWithComments).toBe(80);
	});
}
