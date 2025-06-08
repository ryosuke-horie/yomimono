/**
 * 評価システムのエラーハンドリング改善テスト
 * Issue #618 対応: より詳細なエラー分類とステータスコード
 */
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { IRatingService } from "../../../src/interfaces/service/rating";
import { createRatingsRouter } from "../../../src/routes/ratings";

describe("評価システム強化エラーハンドリングテスト", () => {
	let mockRatingService: IRatingService;
	let app: ReturnType<typeof createRatingsRouter>;

	beforeEach(() => {
		// Mock rating service
		mockRatingService = {
			createRating: vi.fn(),
			getRating: vi.fn(),
			updateRating: vi.fn(),
			deleteRating: vi.fn(),
			getRatings: vi.fn(),
			getRatingStats: vi.fn(),
		};

		app = createRatingsRouter(mockRatingService);
	});

	describe("POST /bookmarks/:id/rating - 強化エラーハンドリング", () => {
		test("FOREIGN KEY制約エラーを404として扱う", async () => {
			const articleId = 999;
			const ratingData = {
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 6,
				novelty: 5,
				importance: 9,
			};

			vi.mocked(mockRatingService.createRating).mockRejectedValueOnce(
				new Error("FOREIGN KEY constraint failed: SQLITE_CONSTRAINT"),
			);

			const res = await app.request(`/bookmarks/${articleId}/rating`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(ratingData),
			});

			expect(res.status).toBe(404);
			const responseData = await res.json();
			expect(responseData.success).toBe(false);
		});

		test("重複評価エラーを409として扱う", async () => {
			const articleId = 1;
			const ratingData = {
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 6,
				novelty: 5,
				importance: 9,
			};

			vi.mocked(mockRatingService.createRating).mockRejectedValueOnce(
				new Error("この記事には既に評価が存在します"),
			);

			const res = await app.request(`/bookmarks/${articleId}/rating`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(ratingData),
			});

			expect(res.status).toBe(409);
			const responseData = await res.json();
			expect(responseData.success).toBe(false);
		});

		test("バリデーションエラーを400として扱う", async () => {
			const articleId = 1;
			const ratingData = {
				practicalValue: 8,
				technicalDepth: 7,
				understanding: 6,
				novelty: 5,
				importance: 9,
			};

			vi.mocked(mockRatingService.createRating).mockRejectedValueOnce(
				new Error("評価スコアは1から10の整数である必要があります"),
			);

			const res = await app.request(`/bookmarks/${articleId}/rating`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(ratingData),
			});

			expect(res.status).toBe(400);
			const responseData = await res.json();
			expect(responseData.success).toBe(false);
		});
	});

	describe("PATCH /bookmarks/:id/rating - 強化エラーハンドリング", () => {
		test("FOREIGN KEY制約エラーを404として扱う", async () => {
			const articleId = 999;
			const updateData = { practicalValue: 9 };

			vi.mocked(mockRatingService.updateRating).mockRejectedValueOnce(
				new Error("SQLITE_CONSTRAINT: FOREIGN KEY constraint failed"),
			);

			const res = await app.request(`/bookmarks/${articleId}/rating`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updateData),
			});

			expect(res.status).toBe(404);
			const responseData = await res.json();
			expect(responseData.success).toBe(false);
		});

		test("空の更新データエラーを400として扱う", async () => {
			const articleId = 1;
			const updateData = {};

			vi.mocked(mockRatingService.updateRating).mockRejectedValueOnce(
				new Error("更新するデータが指定されていません"),
			);

			const res = await app.request(`/bookmarks/${articleId}/rating`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updateData),
			});

			expect(res.status).toBe(400);
			const responseData = await res.json();
			expect(responseData.success).toBe(false);
		});
	});

	describe("DELETE /bookmarks/:id/rating - 強化エラーハンドリング", () => {
		test("FOREIGN KEY制約エラーを404として扱う", async () => {
			const articleId = 999;

			vi.mocked(mockRatingService.deleteRating).mockRejectedValueOnce(
				new Error("FOREIGN KEY constraint failed"),
			);

			const res = await app.request(`/bookmarks/${articleId}/rating`, {
				method: "DELETE",
			});

			expect(res.status).toBe(404);
			const responseData = await res.json();
			expect(responseData.success).toBe(false);
		});
	});
});
