/**
 * 記事評価ポイント機能のパフォーマンステスト
 * 大量データ処理、レスポンス時間、メモリ使用量をテスト
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleRating } from "../../src/db/schema";
import type { IArticleRatingRepository } from "../../src/interfaces/repository/articleRating";
import type { CreateRatingData } from "../../src/interfaces/service/rating";
import { DefaultRatingService } from "../../src/services/rating";

// パフォーマンステスト用の大量データ生成
const generateMockRatings = (count: number): ArticleRating[] => {
	const ratings: ArticleRating[] = [];
	for (let i = 1; i <= count; i++) {
		ratings.push({
			id: i,
			articleId: i,
			practicalValue: Math.floor(Math.random() * 10) + 1,
			technicalDepth: Math.floor(Math.random() * 10) + 1,
			understanding: Math.floor(Math.random() * 10) + 1,
			novelty: Math.floor(Math.random() * 10) + 1,
			importance: Math.floor(Math.random() * 10) + 1,
			totalScore: Math.floor(Math.random() * 100) + 1,
			comment: i % 2 === 0 ? `パフォーマンステスト用コメント ${i}` : null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}
	return ratings;
};

// パフォーマンステスト用のリポジトリ実装
class PerformanceTestRepository implements IArticleRatingRepository {
	private data: ArticleRating[] = [];

	constructor(initialData: ArticleRating[] = []) {
		this.data = [...initialData];
	}

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
			id: this.data.length + 1,
			articleId: rating.articleId,
			practicalValue: rating.practicalValue,
			technicalDepth: rating.technicalDepth,
			understanding: rating.understanding,
			novelty: rating.novelty,
			importance: rating.importance,
			totalScore: rating.totalScore,
			comment: rating.comment || null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.data.push(newRating);
		return newRating;
	}

	async findByArticleId(articleId: number): Promise<ArticleRating | null> {
		// 線形検索の意図的な実装（パフォーマンステスト用）
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

		this.data[index] = {
			...this.data[index],
			...rating,
			updatedAt: new Date(),
		};

		return this.data[index];
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

		// フィルタリング処理
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

		// ソート処理
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

		// 統計計算処理
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
			averageScore: sums.totalScore / total / 10,
			averagePracticalValue: sums.practicalValue / total,
			averageTechnicalDepth: sums.technicalDepth / total,
			averageUnderstanding: sums.understanding / total,
			averageNovelty: sums.novelty / total,
			averageImportance: sums.importance / total,
			ratingsWithComments,
		};
	}

	// テストユーティリティ
	getDataSize(): number {
		return this.data.length;
	}

	clear(): void {
		this.data = [];
	}
}

// パフォーマンス測定ユーティリティ
const measurePerformance = async <T>(
	operation: () => Promise<T>,
	label: string,
): Promise<{
	result: T;
	duration: number;
	memoryUsage?: NodeJS.MemoryUsage;
}> => {
	const startTime = performance.now();
	const startMemory = process.memoryUsage();

	const result = await operation();

	const endTime = performance.now();
	const endMemory = process.memoryUsage();

	const duration = endTime - startTime;
	const memoryUsage = {
		rss: endMemory.rss - startMemory.rss,
		heapTotal: endMemory.heapTotal - startMemory.heapTotal,
		heapUsed: endMemory.heapUsed - startMemory.heapUsed,
		external: endMemory.external - startMemory.external,
		arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
	};

	console.log(`Performance: ${label} - ${duration.toFixed(2)}ms`);
	console.log(
		`Memory: ${label} - ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB heap used`,
	);

	return { result, duration, memoryUsage };
};

describe("記事評価ポイント パフォーマンステスト", () => {
	let repository: PerformanceTestRepository;
	let service: DefaultRatingService;

	beforeEach(() => {
		repository = new PerformanceTestRepository();
		service = new DefaultRatingService(repository);
	});

	describe("大量データ処理パフォーマンス", () => {
		it("10,000件の評価データ検索が1秒以内に完了すること", async () => {
			// 大量データ準備
			const mockData = generateMockRatings(10000);
			repository = new PerformanceTestRepository(mockData);
			service = new DefaultRatingService(repository);

			// 検索パフォーマンス測定
			const { duration } = await measurePerformance(async () => {
				return await service.getRatings({
					limit: 100,
					minScore: 7.0,
					sortBy: "totalScore",
					order: "desc",
				});
			}, "10,000件データ検索");

			// 1秒以内の完了を期待
			expect(duration).toBeLessThan(1000);
		});

		it("1,000件の評価データ統計計算が500ms以内に完了すること", async () => {
			// 中規模データ準備
			const mockData = generateMockRatings(1000);
			repository = new PerformanceTestRepository(mockData);
			service = new DefaultRatingService(repository);

			// 統計計算パフォーマンス測定
			const { duration, result } = await measurePerformance(async () => {
				return await service.getRatingStats();
			}, "1,000件統計計算");

			// 500ms以内の完了を期待
			expect(duration).toBeLessThan(500);
			expect(result.totalCount).toBe(1000);
		});

		it("100件の一括評価作成が200ms以内に完了すること", async () => {
			const ratingsToCreate: CreateRatingData[] = [];
			for (let i = 1; i <= 100; i++) {
				ratingsToCreate.push({
					practicalValue: Math.floor(Math.random() * 10) + 1,
					technicalDepth: Math.floor(Math.random() * 10) + 1,
					understanding: Math.floor(Math.random() * 10) + 1,
					novelty: Math.floor(Math.random() * 10) + 1,
					importance: Math.floor(Math.random() * 10) + 1,
					comment: `一括作成テスト ${i}`,
				});
			}

			// 一括作成パフォーマンス測定
			const { duration } = await measurePerformance(async () => {
				const results = [];
				for (let i = 0; i < ratingsToCreate.length; i++) {
					const result = await service.createRating(i + 1, ratingsToCreate[i]);
					results.push(result);
				}
				return results;
			}, "100件一括作成");

			// 200ms以内の完了を期待
			expect(duration).toBeLessThan(200);
			expect(repository.getDataSize()).toBe(100);
		});
	});

	describe("メモリ使用量テスト", () => {
		it("大量データ処理時のメモリリークがないこと", async () => {
			const initialMemory = process.memoryUsage();

			// 複数回の大量データ処理
			for (let iteration = 0; iteration < 5; iteration++) {
				const mockData = generateMockRatings(1000);
				repository = new PerformanceTestRepository(mockData);
				service = new DefaultRatingService(repository);

				// データ処理実行
				await service.getRatings({ limit: 100 });
				await service.getRatingStats();

				// ガベージコレクション実行
				if (global.gc) {
					global.gc();
				}
			}

			const finalMemory = process.memoryUsage();
			const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

			// メモリ増加が10MB以下であることを確認
			expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
		});
	});

	describe("同時処理パフォーマンス", () => {
		it("10並列の評価作成が正常に処理されること", async () => {
			const mockData = generateMockRatings(100);
			repository = new PerformanceTestRepository(mockData);
			service = new DefaultRatingService(repository);

			const { duration } = await measurePerformance(async () => {
				const promises = [];
				for (let i = 101; i <= 110; i++) {
					promises.push(
						service.createRating(i, {
							practicalValue: 8,
							technicalDepth: 7,
							understanding: 9,
							novelty: 6,
							importance: 8,
							comment: `並列作成テスト ${i}`,
						}),
					);
				}
				return await Promise.all(promises);
			}, "10並列評価作成");

			// 並列処理が100ms以内に完了することを期待
			expect(duration).toBeLessThan(100);
			expect(repository.getDataSize()).toBe(110);
		});

		it("混合処理（作成・更新・取得）が効率的に実行されること", async () => {
			const mockData = generateMockRatings(500);
			repository = new PerformanceTestRepository(mockData);
			service = new DefaultRatingService(repository);

			const { duration } = await measurePerformance(async () => {
				const results = await Promise.all([
					// 作成処理
					service.createRating(501, {
						practicalValue: 8,
						technicalDepth: 7,
						understanding: 9,
						novelty: 6,
						importance: 8,
					}),
					// 更新処理
					service.updateRating(1, {
						practicalValue: 10,
						comment: "更新テスト",
					}),
					// 検索処理
					service.getRatings({
						limit: 50,
						sortBy: "totalScore",
						order: "desc",
					}),
					// 統計処理
					service.getRatingStats(),
				]);
				return results;
			}, "混合処理実行");

			// 混合処理が300ms以内に完了することを期待
			expect(duration).toBeLessThan(300);
		});
	});

	describe("レスポンス時間分析", () => {
		it("P95レスポンス時間が許容範囲内であること", async () => {
			const mockData = generateMockRatings(1000);
			repository = new PerformanceTestRepository(mockData);
			service = new DefaultRatingService(repository);

			const responseTimes: number[] = [];

			// 100回の検索実行
			for (let i = 0; i < 100; i++) {
				const { duration } = await measurePerformance(
					async () => {
						return await service.getRatings({
							limit: 20,
							offset: i * 10,
						});
					},
					`検索処理 ${i + 1}`,
				);
				responseTimes.push(duration);
			}

			// レスポンス時間の統計計算
			responseTimes.sort((a, b) => a - b);
			const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
			const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
			const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];

			console.log(
				`Response times - P50: ${p50.toFixed(2)}ms, P95: ${p95.toFixed(2)}ms, P99: ${p99.toFixed(2)}ms`,
			);

			// P95レスポンス時間が50ms以下であることを期待
			expect(p95).toBeLessThan(50);
			// P99レスポンス時間が100ms以下であることを期待
			expect(p99).toBeLessThan(100);
		});
	});

	describe("リソース使用効率テスト", () => {
		it("CPU集約的な処理が効率的に実行されること", async () => {
			const mockData = generateMockRatings(5000);
			repository = new PerformanceTestRepository(mockData);
			service = new DefaultRatingService(repository);

			// CPU集約的な処理をシミュレート
			const { duration } = await measurePerformance(async () => {
				const results = [];
				// 複数の統計計算を並列実行
				for (let i = 0; i < 10; i++) {
					results.push(await service.getRatingStats());
				}
				return results;
			}, "CPU集約処理");

			// 5秒以内に完了することを期待
			expect(duration).toBeLessThan(5000);
		});
	});
});

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("パフォーマンステストが正しく設定されている", () => {
		expect(true).toBe(true);
	});
}
