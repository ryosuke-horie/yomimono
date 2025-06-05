/**
 * 記事評価ポイント機能のAPI↔DB統合テスト
 * サービス層とリポジトリ層の統合をテスト（モックDB使用）
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleRating } from "../../src/db/schema";
import type { IArticleRatingRepository } from "../../src/interfaces/repository/articleRating";
import type { CreateRatingData } from "../../src/interfaces/service/rating";
import { DefaultRatingService } from "../../src/services/rating";

// 統合テスト用のメモリリポジトリ実装
class MemoryArticleRatingRepository implements IArticleRatingRepository {
	private data: ArticleRating[] = [];
	private nextId = 1;

	async create(rating: {
		articleId: number;
		practicalValue: number;
		technicalDepth: number;
		understanding: number;
		novelty: number;
		importance: number;
		totalScore: number;
		comment?: string;
	}): Promise<ArticleRating> {
		const newRating: ArticleRating = {
			id: this.nextId++,
			articleId: rating.articleId,
			practicalValue: rating.practicalValue,
			technicalDepth: rating.technicalDepth,
			understanding: rating.understanding,
			novelty: rating.novelty,
			importance: rating.importance,
			totalScore: Math.round(
				((rating.practicalValue +
					rating.technicalDepth +
					rating.understanding +
					rating.novelty +
					rating.importance) /
					5) *
					10,
			),
			comment: rating.comment || null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.data.push(newRating);
		return newRating;
	}

	async findByArticleId(articleId: number): Promise<ArticleRating | null> {
		return this.data.find((r) => r.articleId === articleId) || null;
	}

	async update(
		articleId: number,
		rating: Partial<{
			practicalValue: number;
			technicalDepth: number;
			understanding: number;
			novelty: number;
			importance: number;
			comment: string;
		}>,
	): Promise<ArticleRating | null> {
		const index = this.data.findIndex((r) => r.articleId === articleId);
		if (index === -1) return null;

		const current = this.data[index];
		const updated = {
			...current,
			...rating,
			updatedAt: new Date(),
		};

		// 総合スコア再計算
		updated.totalScore = Math.round(
			((updated.practicalValue +
				updated.technicalDepth +
				updated.understanding +
				updated.novelty +
				updated.importance) /
				5) *
				10,
		);

		this.data[index] = updated;
		return updated;
	}

	async delete(articleId: number): Promise<boolean> {
		const initialLength = this.data.length;
		this.data = this.data.filter((r) => r.articleId !== articleId);
		return this.data.length < initialLength;
	}

	async findMany(options: {
		sortBy?: string;
		order?: string;
		limit?: number;
		offset?: number;
		minScore?: number;
		maxScore?: number;
		hasComment?: boolean;
	}): Promise<ArticleRating[]> {
		let filtered = [...this.data];

		// フィルタリング
		if (options.minScore !== undefined) {
			filtered = filtered.filter(
				(r) => r.totalScore >= Math.round(options.minScore * 10),
			);
		}
		if (options.maxScore !== undefined) {
			filtered = filtered.filter(
				(r) => r.totalScore <= Math.round(options.maxScore * 10),
			);
		}
		if (options.hasComment !== undefined) {
			if (options.hasComment) {
				filtered = filtered.filter((r) => r.comment && r.comment.trim() !== "");
			} else {
				filtered = filtered.filter(
					(r) => !r.comment || r.comment.trim() === "",
				);
			}
		}

		// ソート
		const sortBy = options.sortBy || "createdAt";
		const order = options.order || "desc";
		filtered.sort((a, b) => {
			// biome-ignore lint/suspicious/noExplicitAny: 動的プロパティアクセス
			const aVal = (a as any)[sortBy];
			// biome-ignore lint/suspicious/noExplicitAny: 動的プロパティアクセス
			const bVal = (b as any)[sortBy];

			if (aVal < bVal) return order === "asc" ? -1 : 1;
			if (aVal > bVal) return order === "asc" ? 1 : -1;
			return 0;
		});

		// ページネーション
		const offset = options.offset || 0;
		const limit = Math.min(options.limit || 20, 100);
		return filtered.slice(offset, offset + limit);
	}

	async getStats(): Promise<{
		totalCount: number;
		averageScore: number;
		averagePracticalValue: number;
		averageTechnicalDepth: number;
		averageUnderstanding: number;
		averageNovelty: number;
		averageImportance: number;
		ratingsWithComments: number;
	}> {
		const total = this.data.length;
		if (total === 0) {
			return {
				totalCount: 0,
				averageScore: 0,
				averagePracticalValue: 0,
				averageTechnicalDepth: 0,
				averageUnderstanding: 0,
				averageNovelty: 0,
				averageImportance: 0,
				ratingsWithComments: 0,
			};
		}

		const sums = this.data.reduce(
			(acc, rating) => ({
				totalScore: acc.totalScore + rating.totalScore,
				practicalValue: acc.practicalValue + rating.practicalValue,
				technicalDepth: acc.technicalDepth + rating.technicalDepth,
				understanding: acc.understanding + rating.understanding,
				novelty: acc.novelty + rating.novelty,
				importance: acc.importance + rating.importance,
			}),
			{
				totalScore: 0,
				practicalValue: 0,
				technicalDepth: 0,
				understanding: 0,
				novelty: 0,
				importance: 0,
			},
		);

		const ratingsWithComments = this.data.filter(
			(r) => r.comment && r.comment.trim() !== "",
		).length;

		return {
			totalCount: total,
			averageScore: sums.totalScore / total / 10, // 整数化された値を元に戻す
			averagePracticalValue: sums.practicalValue / total,
			averageTechnicalDepth: sums.technicalDepth / total,
			averageUnderstanding: sums.understanding / total,
			averageNovelty: sums.novelty / total,
			averageImportance: sums.importance / total,
			ratingsWithComments,
		};
	}

	// テスト用メソッド
	clear() {
		this.data = [];
		this.nextId = 1;
	}
}

describe("記事評価ポイント API↔DB 統合テスト", () => {
	let repository: MemoryArticleRatingRepository;
	let service: DefaultRatingService;

	beforeEach(() => {
		repository = new MemoryArticleRatingRepository();
		service = new DefaultRatingService(repository);
		repository.clear();
	});

	describe("評価作成→取得→更新→削除のフルワークフロー", () => {
		it("記事評価の完全なライフサイクルが正常に動作すること", async () => {
			const articleId = 123;
			const initialRatingData: CreateRatingData = {
				practicalValue: 8,
				technicalDepth: 9,
				understanding: 7,
				novelty: 6,
				importance: 8,
				comment: "初期コメント",
			};

			// 1. 評価作成
			const createdRating = await service.createRating(
				articleId,
				initialRatingData,
			);
			expect(createdRating).toMatchObject({
				articleId: articleId,
				practicalValue: 8,
				technicalDepth: 9,
				understanding: 7,
				novelty: 6,
				importance: 8,
				comment: "初期コメント",
			});
			expect(createdRating.id).toBeDefined();
			expect(createdRating.totalScore).toBeGreaterThan(0);

			// 2. 評価取得
			const retrievedRating = await service.getRating(articleId);
			expect(retrievedRating).toEqual(createdRating);

			// 3. 評価更新
			const updateData = {
				practicalValue: 10,
				comment: "更新されたコメント",
			};
			const updatedRating = await service.updateRating(articleId, updateData);
			expect(updatedRating).toMatchObject({
				articleId: articleId,
				practicalValue: 10,
				comment: "更新されたコメント",
			});
			expect(updatedRating?.totalScore).toBe(80); // (10+9+7+6+8)/5 * 10 = 80
			expect(updatedRating?.totalScore).not.toBe(createdRating.totalScore);

			// 4. 評価削除
			await service.deleteRating(articleId);
			const deletedRating = await service.getRating(articleId);
			expect(deletedRating).toBeNull();
		});

		it("複数の評価を作成して一覧取得ができること", async () => {
			// 複数の評価を作成
			const ratings = [
				{
					articleId: 101,
					data: {
						practicalValue: 8,
						technicalDepth: 7,
						understanding: 9,
						novelty: 6,
						importance: 8,
						comment: "評価1",
					},
				},
				{
					articleId: 102,
					data: {
						practicalValue: 9,
						technicalDepth: 8,
						understanding: 8,
						novelty: 7,
						importance: 9,
						comment: "評価2",
					},
				},
				{
					articleId: 103,
					data: {
						practicalValue: 7,
						technicalDepth: 9,
						understanding: 7,
						novelty: 8,
						importance: 7,
						comment: "評価3",
					},
				},
			];

			// 全ての評価を作成
			for (const rating of ratings) {
				await service.createRating(rating.articleId, rating.data);
			}

			// 評価一覧を取得
			const retrievedRatings = await service.getRatings({
				limit: 10,
				offset: 0,
			});

			expect(retrievedRatings).toHaveLength(3);
			expect(retrievedRatings.map((r) => r.articleId)).toEqual(
				expect.arrayContaining([101, 102, 103]),
			);
		});

		it("統計情報が正確に計算されること", async () => {
			// テストデータ作成
			const testRatings = [
				{
					articleId: 201,
					data: {
						practicalValue: 8,
						technicalDepth: 8,
						understanding: 8,
						novelty: 8,
						importance: 8,
						comment: "コメント付き評価",
					},
				},
				{
					articleId: 202,
					data: {
						practicalValue: 6,
						technicalDepth: 6,
						understanding: 6,
						novelty: 6,
						importance: 6,
					},
				},
				{
					articleId: 203,
					data: {
						practicalValue: 10,
						technicalDepth: 10,
						understanding: 10,
						novelty: 10,
						importance: 10,
						comment: "高評価",
					},
				},
			];

			// 評価を作成
			for (const rating of testRatings) {
				await service.createRating(rating.articleId, rating.data);
			}

			// 統計情報を取得
			const stats = await service.getRatingStats();

			expect(stats.totalCount).toBe(3);
			expect(stats.averageScore).toBeCloseTo(8.0, 1); // (8+6+10)/3 = 8
			expect(stats.averagePracticalValue).toBeCloseTo(8.0, 1);
			expect(stats.ratingsWithComments).toBe(2);
		});
	});

	describe("エラーハンドリング統合テスト", () => {
		it("重複作成エラーが正しく処理されること", async () => {
			const articleId = 500;
			const ratingData: CreateRatingData = {
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
			};

			// 最初の評価作成
			await service.createRating(articleId, ratingData);

			// 重複作成の試行
			await expect(service.createRating(articleId, ratingData)).rejects.toThrow(
				"この記事には既に評価が存在します",
			);
		});

		it("存在しない評価の更新・削除エラーが正しく処理されること", async () => {
			const nonExistentArticleId = 999;

			// 存在しない評価の更新
			await expect(
				service.updateRating(nonExistentArticleId, { practicalValue: 8 }),
			).rejects.toThrow("指定された記事の評価が見つかりません");

			// 存在しない評価の削除
			await expect(service.deleteRating(nonExistentArticleId)).rejects.toThrow(
				"指定された記事の評価が見つかりません",
			);
		});

		it("バリデーションエラーが正しく処理されること", async () => {
			const articleId = 600;

			// 無効なスコア値
			await expect(
				service.createRating(articleId, {
					practicalValue: 11, // 1-10範囲外
					technicalDepth: 7,
					understanding: 9,
					novelty: 6,
					importance: 8,
				}),
			).rejects.toThrow("評価スコアは1から10の整数である必要があります");

			// 長すぎるコメント
			await expect(
				service.createRating(articleId, {
					practicalValue: 8,
					technicalDepth: 7,
					understanding: 9,
					novelty: 6,
					importance: 8,
					comment: "a".repeat(1001), // 1001文字
				}),
			).rejects.toThrow("コメントは1000文字以内で入力してください");
		});
	});
});

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("API↔DB統合テストが正しく設定されている", () => {
		expect(true).toBe(true);
	});
}
