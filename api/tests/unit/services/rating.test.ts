/**
 * 記事評価ポイントサービスのテストコード
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleRating, Bookmark } from "../../../src/db/schema";
import type { IArticleRatingRepository } from "../../../src/interfaces/repository/articleRating";
import type { IBookmarkRepository } from "../../../src/interfaces/repository/bookmark";
import type {
	CreateRatingData,
	UpdateRatingData,
} from "../../../src/interfaces/service/rating";
import { DefaultRatingService } from "../../../src/services/rating";

describe("DefaultRatingService", () => {
	let service: DefaultRatingService;
	let mockRepository: IArticleRatingRepository;
	let mockBookmarkRepository: IBookmarkRepository;

	beforeEach(() => {
		mockRepository = {
			create: vi.fn(),
			findByArticleId: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			findMany: vi.fn(),
			getStats: vi.fn(),
		};

		mockBookmarkRepository = {
			create: vi.fn(),
			findById: vi.fn(),
			findByUrl: vi.fn(),
			findMany: vi.fn(),
			findManyWithLabel: vi.fn(),
			markAsRead: vi.fn(),
			markAsUnread: vi.fn(),
			addToFavorites: vi.fn(),
			removeFromFavorites: vi.fn(),
			getUnreadCount: vi.fn(),
			getTodayReadCount: vi.fn(),
			getUnratedArticles: vi.fn(),
			getUnreadBookmarks: vi.fn(),
			getReadBookmarks: vi.fn(),
		};

		service = new DefaultRatingService(mockRepository, mockBookmarkRepository);
	});

	describe("createRating", () => {
		it("新しい評価を正常に作成できること", async () => {
			const articleId = 1;
			const ratingData: CreateRatingData = {
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				comment: "とても良い記事でした",
			};

			const mockBookmark: Bookmark = {
				id: 1,
				url: "https://example.com/article",
				title: "テスト記事",
				isRead: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const expectedRating: ArticleRating = {
				id: 1,
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 76,
				comment: "とても良い記事でした",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(mockBookmarkRepository.findById).mockResolvedValueOnce(
				mockBookmark,
			);
			vi.mocked(mockRepository.findByArticleId).mockResolvedValueOnce(null);
			vi.mocked(mockRepository.create).mockResolvedValueOnce(expectedRating);

			const result = await service.createRating(articleId, ratingData);

			expect(result).toEqual(expectedRating);
			expect(mockBookmarkRepository.findById).toHaveBeenCalledWith(articleId);
			expect(mockRepository.findByArticleId).toHaveBeenCalledWith(articleId);
			expect(mockRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					articleId,
					...ratingData,
					totalScore: 0,
				}),
			);
		});

		it("記事が存在しない場合はエラーを投げること", async () => {
			const articleId = 999;
			const ratingData: CreateRatingData = {
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
			};

			vi.mocked(mockBookmarkRepository.findById).mockResolvedValueOnce(null);

			await expect(service.createRating(articleId, ratingData)).rejects.toThrow(
				"指定された記事が見つかりません",
			);
		});

		it("既存の評価が存在する場合はエラーを投げること", async () => {
			const articleId = 1;
			const ratingData: CreateRatingData = {
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
			};

			const mockBookmark: Bookmark = {
				id: 1,
				url: "https://example.com/article",
				title: "テスト記事",
				isRead: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const existingRating: ArticleRating = {
				id: 1,
				articleId: 1,
				practicalValue: 7,
				technicalDepth: 8,
				understanding: 8,
				novelty: 7,
				importance: 7,
				totalScore: 74,
				comment: "既存の評価",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(mockBookmarkRepository.findById).mockResolvedValueOnce(
				mockBookmark,
			);
			vi.mocked(mockRepository.findByArticleId).mockResolvedValueOnce(
				existingRating,
			);

			await expect(service.createRating(articleId, ratingData)).rejects.toThrow(
				"この記事には既に評価が存在します",
			);
		});

		it("無効なスコア値の場合はエラーを投げること", async () => {
			const articleId = 1;
			const ratingData: CreateRatingData = {
				practicalValue: 11, // 無効値（1-10範囲外）
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
			};

			const mockBookmark: Bookmark = {
				id: 1,
				url: "https://example.com/article",
				title: "テスト記事",
				isRead: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(mockBookmarkRepository.findById).mockResolvedValueOnce(
				mockBookmark,
			);
			vi.mocked(mockRepository.findByArticleId).mockResolvedValueOnce(null);

			await expect(service.createRating(articleId, ratingData)).rejects.toThrow(
				"評価スコアは1から10の整数である必要があります",
			);
		});

		it("コメントが1000文字を超える場合はエラーを投げること", async () => {
			const articleId = 1;
			const ratingData: CreateRatingData = {
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				comment: "a".repeat(1001), // 1001文字
			};

			const mockBookmark: Bookmark = {
				id: 1,
				url: "https://example.com/article",
				title: "テスト記事",
				isRead: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(mockBookmarkRepository.findById).mockResolvedValueOnce(
				mockBookmark,
			);
			vi.mocked(mockRepository.findByArticleId).mockResolvedValueOnce(null);

			await expect(service.createRating(articleId, ratingData)).rejects.toThrow(
				"コメントは1000文字以内で入力してください",
			);
		});
	});

	describe("getRating", () => {
		it("記事の評価を正常に取得できること", async () => {
			const articleId = 1;
			const expectedRating: ArticleRating = {
				id: 1,
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 76,
				comment: "テスト評価",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(mockRepository.findByArticleId).mockResolvedValueOnce(
				expectedRating,
			);

			const result = await service.getRating(articleId);

			expect(result).toEqual(expectedRating);
			expect(mockRepository.findByArticleId).toHaveBeenCalledWith(articleId);
		});

		it("評価が存在しない場合はnullを返すこと", async () => {
			const articleId = 999;

			vi.mocked(mockRepository.findByArticleId).mockResolvedValueOnce(null);

			const result = await service.getRating(articleId);

			expect(result).toBeNull();
		});
	});

	describe("updateRating", () => {
		it("記事の評価を正常に更新できること", async () => {
			const articleId = 1;
			const updateData: UpdateRatingData = {
				practicalValue: 9,
				comment: "更新されたコメント",
			};

			const mockBookmark: Bookmark = {
				id: 1,
				url: "https://example.com/article",
				title: "テスト記事",
				isRead: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const existingRating: ArticleRating = {
				id: 1,
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 76,
				comment: "元のコメント",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const updatedRating: ArticleRating = {
				...existingRating,
				practicalValue: 9,
				comment: "更新されたコメント",
				totalScore: 78,
				updatedAt: new Date(),
			};

			vi.mocked(mockBookmarkRepository.findById).mockResolvedValueOnce(
				mockBookmark,
			);
			vi.mocked(mockRepository.findByArticleId).mockResolvedValueOnce(
				existingRating,
			);
			vi.mocked(mockRepository.update).mockResolvedValueOnce(updatedRating);

			const result = await service.updateRating(articleId, updateData);

			expect(result).toEqual(updatedRating);
			expect(mockBookmarkRepository.findById).toHaveBeenCalledWith(articleId);
			expect(mockRepository.findByArticleId).toHaveBeenCalledWith(articleId);
			expect(mockRepository.update).toHaveBeenCalledWith(articleId, updateData);
		});

		it("存在しない記事の場合はエラーを投げること", async () => {
			const articleId = 999;
			const updateData: UpdateRatingData = {
				practicalValue: 9,
			};

			vi.mocked(mockBookmarkRepository.findById).mockResolvedValueOnce(null);

			await expect(service.updateRating(articleId, updateData)).rejects.toThrow(
				"指定された記事が見つかりません",
			);
		});

		it("更新データが空の場合はエラーを投げること", async () => {
			const articleId = 1;
			const updateData: UpdateRatingData = {};

			const mockBookmark: Bookmark = {
				id: 1,
				url: "https://example.com/article",
				title: "テスト記事",
				isRead: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const existingRating: ArticleRating = {
				id: 1,
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 76,
				comment: "元のコメント",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(mockBookmarkRepository.findById).mockResolvedValueOnce(
				mockBookmark,
			);
			vi.mocked(mockRepository.findByArticleId).mockResolvedValueOnce(
				existingRating,
			);

			await expect(service.updateRating(articleId, updateData)).rejects.toThrow(
				"更新するデータが指定されていません",
			);
		});
	});

	describe("deleteRating", () => {
		it("記事の評価を正常に削除できること", async () => {
			const articleId = 1;

			const mockBookmark: Bookmark = {
				id: 1,
				url: "https://example.com/article",
				title: "テスト記事",
				isRead: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const existingRating: ArticleRating = {
				id: 1,
				articleId: 1,
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 9,
				novelty: 6,
				importance: 8,
				totalScore: 76,
				comment: "削除される評価",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(mockBookmarkRepository.findById).mockResolvedValueOnce(
				mockBookmark,
			);
			vi.mocked(mockRepository.findByArticleId).mockResolvedValueOnce(
				existingRating,
			);
			vi.mocked(mockRepository.delete).mockResolvedValueOnce(true);

			await service.deleteRating(articleId);

			expect(mockBookmarkRepository.findById).toHaveBeenCalledWith(articleId);
			expect(mockRepository.findByArticleId).toHaveBeenCalledWith(articleId);
			expect(mockRepository.delete).toHaveBeenCalledWith(articleId);
		});

		it("存在しない記事の場合はエラーを投げること", async () => {
			const articleId = 999;

			vi.mocked(mockBookmarkRepository.findById).mockResolvedValueOnce(null);

			await expect(service.deleteRating(articleId)).rejects.toThrow(
				"指定された記事が見つかりません",
			);
		});
	});

	describe("getRatings", () => {
		it("評価一覧を正常に取得できること", async () => {
			const ratings: ArticleRating[] = [
				{
					id: 1,
					articleId: 1,
					practicalValue: 8,
					technicalDepth: 7,
					understanding: 9,
					novelty: 6,
					importance: 8,
					totalScore: 76,
					comment: "評価1",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			vi.mocked(mockRepository.findMany).mockResolvedValueOnce(ratings);

			const result = await service.getRatings();

			expect(result).toEqual(ratings);
			expect(mockRepository.findMany).toHaveBeenCalledWith({
				sortBy: "createdAt",
				order: "desc",
				limit: 20,
				offset: 0,
			});
		});

		it("無効なソート条件の場合はデフォルト値を使用すること", async () => {
			const ratings: ArticleRating[] = [];

			vi.mocked(mockRepository.findMany).mockResolvedValueOnce(ratings);

			const result = await service.getRatings({
				// @ts-expect-error Testing invalid values
				sortBy: "invalid",
				// @ts-expect-error Testing invalid values
				order: "invalid",
				limit: 200, // 上限を超える値
				offset: -1, // 負の値
			});

			expect(result).toEqual(ratings);
			expect(mockRepository.findMany).toHaveBeenCalledWith({
				sortBy: "createdAt", // デフォルト値
				order: "desc", // デフォルト値
				limit: 100, // 上限値
				offset: 0, // 最小値
			});
		});

		it("最小スコアが最大スコアより大きい場合はエラーを投げること", async () => {
			await expect(
				service.getRatings({
					minScore: 8,
					maxScore: 5, // 最小スコアより小さい
				}),
			).rejects.toThrow("最小スコアは最大スコア以下である必要があります");
		});

		it("最小スコアが範囲外の場合はエラーを投げること", async () => {
			await expect(
				service.getRatings({
					minScore: 0.5, // 1.0未満
				}),
			).rejects.toThrow("最小スコアは1.0から10.0の範囲で指定してください");
		});

		it("最大スコアが範囲外の場合はエラーを投げること", async () => {
			await expect(
				service.getRatings({
					maxScore: 11.0, // 10.0超過
				}),
			).rejects.toThrow("最大スコアは1.0から10.0の範囲で指定してください");
		});

		it("hasCommentオプションを正しく処理すること", async () => {
			const ratings: ArticleRating[] = [];

			vi.mocked(mockRepository.findMany).mockResolvedValueOnce(ratings);

			await service.getRatings({
				hasComment: true,
			});

			expect(mockRepository.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					hasComment: true,
				}),
			);
		});
	});

	describe("getRatingStats", () => {
		it("評価統計情報を正常に取得できること", async () => {
			const stats = {
				totalCount: 10,
				averageScore: 7.5,
				averagePracticalValue: 7.8,
				averageTechnicalDepth: 7.2,
				averageUnderstanding: 8.1,
				averageNovelty: 6.9,
				averageImportance: 7.5,
				ratingsWithComments: 7,
			};

			vi.mocked(mockRepository.getStats).mockResolvedValueOnce(stats);

			const result = await service.getRatingStats();

			expect(result).toEqual(stats);
			expect(mockRepository.getStats).toHaveBeenCalled();
		});
	});
});
