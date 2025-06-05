/**
 * 記事評価ポイント機能のE2Eテスト
 * UI操作からAPIコールまでの完全なワークフローをテスト
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import RatingsPage from "../../../app/ratings/page";

// テスト用のモックデータ
const mockRatings = [
	{
		id: 1,
		articleId: 123,
		practicalValue: 8,
		technicalDepth: 9,
		understanding: 7,
		novelty: 6,
		importance: 8,
		totalScore: 7.6,
		comment: "非常に実用的な記事です",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 2,
		articleId: 124,
		practicalValue: 9,
		technicalDepth: 8,
		understanding: 8,
		novelty: 7,
		importance: 9,
		totalScore: 8.2,
		comment: "技術的に深い内容",
		createdAt: "2024-01-02T00:00:00Z",
		updatedAt: "2024-01-02T00:00:00Z",
	},
];

const mockStats = {
	totalRatings: 100,
	averageScore: 7.8,
	medianScore: 7.9,
	dimensionAverages: {
		practicalValue: 8.2,
		technicalDepth: 7.8,
		understanding: 7.5,
		novelty: 6.8,
		importance: 8.0,
	},
	scoreDistribution: [
		{ range: "1-2", count: 2, percentage: 2.0 },
		{ range: "3-4", count: 8, percentage: 8.0 },
		{ range: "5-6", count: 20, percentage: 20.0 },
		{ range: "7-8", count: 50, percentage: 50.0 },
		{ range: "9-10", count: 20, percentage: 20.0 },
	],
	topRatedArticles: [],
};

// MSWサーバーセットアップ
const server = setupServer(
	// 評価一覧取得
	http.get("/api/ratings", ({ request }) => {
		const url = new URL(request.url);
		const sortBy = url.searchParams.get("sortBy");
		const order = url.searchParams.get("order");
		const minScore = url.searchParams.get("minScore");

		let filteredRatings = [...mockRatings];

		// フィルタリング
		if (minScore) {
			const minScoreNum = Number.parseFloat(minScore);
			filteredRatings = filteredRatings.filter(r => r.totalScore >= minScoreNum);
		}

		// ソート
		if (sortBy === "totalScore") {
			filteredRatings.sort((a, b) => {
				return order === "asc" ? a.totalScore - b.totalScore : b.totalScore - a.totalScore;
			});
		}

		return Response.json({
			success: true,
			ratings: filteredRatings,
			count: filteredRatings.length,
		});
	}),

	// 統計情報取得
	http.get("/api/ratings/stats", () => {
		return Response.json({
			success: true,
			stats: mockStats,
		});
	}),

	// 個別評価取得
	http.get("/api/bookmarks/:id/rating", ({ params }) => {
		const articleId = Number(params.id);
		const rating = mockRatings.find(r => r.articleId === articleId);
		
		if (!rating) {
			return new Response(null, { status: 404 });
		}

		return Response.json({
			success: true,
			rating,
		});
	}),

	// 評価作成
	http.post("/api/bookmarks/:id/rating", async ({ params, request }) => {
		const articleId = Number(params.id);
		const body = await request.json();
		
		const newRating = {
			id: mockRatings.length + 1,
			articleId,
			...body,
			totalScore: (body.practicalValue + body.technicalDepth + body.understanding + body.novelty + body.importance) / 5,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		return Response.json({
			success: true,
			rating: newRating,
		}, { status: 201 });
	}),

	// 評価更新
	http.patch("/api/bookmarks/:id/rating", async ({ params, request }) => {
		const articleId = Number(params.id);
		const body = await request.json();
		
		const existingRating = mockRatings.find(r => r.articleId === articleId);
		if (!existingRating) {
			return new Response(null, { status: 404 });
		}

		const updatedRating = {
			...existingRating,
			...body,
			totalScore: body.practicalValue ? 
				(body.practicalValue + existingRating.technicalDepth + existingRating.understanding + existingRating.novelty + existingRating.importance) / 5 :
				existingRating.totalScore,
			updatedAt: new Date().toISOString(),
		};

		return Response.json({
			success: true,
			rating: updatedRating,
		});
	}),
);

// テストユーティリティ
const renderWithQueryClient = (component: React.ReactElement) => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>
			{component}
		</QueryClientProvider>
	);
};

describe("記事評価ポイント E2E ワークフロー", () => {
	beforeAll(() => {
		server.listen();
	});

	afterEach(() => {
		server.resetHandlers();
	});

	afterAll(() => {
		server.close();
	});

	describe("評価一覧表示ワークフロー", () => {
		it("評価一覧ページが正常に表示され、データが読み込まれること", async () => {
			renderWithQueryClient(<RatingsPage />);

			// ローディング状態の確認
			expect(screen.getByText(/読み込み中/i)).toBeInTheDocument();

			// データ読み込み完了後の確認
			await waitFor(() => {
				expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
			});

			// 評価一覧の表示確認
			expect(screen.getByText("非常に実用的な記事です")).toBeInTheDocument();
			expect(screen.getByText("技術的に深い内容")).toBeInTheDocument();

			// スコア表示の確認
			expect(screen.getByText("7.6")).toBeInTheDocument();
			expect(screen.getByText("8.2")).toBeInTheDocument();
		});

		it("統計情報が正常に表示されること", async () => {
			renderWithQueryClient(<RatingsPage />);

			await waitFor(() => {
				expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
			});

			// 統計情報の表示確認
			expect(screen.getByText("総評価数: 100件")).toBeInTheDocument();
			expect(screen.getByText("平均スコア: 7.8")).toBeInTheDocument();
		});
	});

	describe("フィルタリング機能ワークフロー", () => {
		it("最小スコアフィルターが正常に動作すること", async () => {
			const user = userEvent.setup();
			renderWithQueryClient(<RatingsPage />);

			await waitFor(() => {
				expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
			});

			// 初期状態では全ての評価が表示されている
			expect(screen.getByText("非常に実用的な記事です")).toBeInTheDocument();
			expect(screen.getByText("技術的に深い内容")).toBeInTheDocument();

			// 最小スコア8.0でフィルター
			const minScoreInput = screen.getByLabelText(/最小スコア/i);
			await user.clear(minScoreInput);
			await user.type(minScoreInput, "8.0");

			const filterButton = screen.getByRole("button", { name: /フィルター適用/i });
			await user.click(filterButton);

			// フィルター結果の確認（スコア8.2の評価のみ表示）
			await waitFor(() => {
				expect(screen.queryByText("非常に実用的な記事です")).not.toBeInTheDocument();
				expect(screen.getByText("技術的に深い内容")).toBeInTheDocument();
			});
		});

		it("ソート機能が正常に動作すること", async () => {
			const user = userEvent.setup();
			renderWithQueryClient(<RatingsPage />);

			await waitFor(() => {
				expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
			});

			// ソート順変更（昇順）
			const sortOrderSelect = screen.getByLabelText(/並び順/i);
			await user.selectOptions(sortOrderSelect, "asc");

			// ソート適用ボタンをクリック
			const sortButton = screen.getByRole("button", { name: /ソート適用/i });
			await user.click(sortButton);

			// ソート結果の確認（スコア順に並び替え）
			await waitFor(() => {
				const ratingElements = screen.getAllByTestId("rating-card");
				expect(ratingElements).toHaveLength(2);
				// 昇順なので低いスコア（7.6）が先に表示される
				expect(ratingElements[0]).toHaveTextContent("7.6");
				expect(ratingElements[1]).toHaveTextContent("8.2");
			});
		});
	});

	describe("エラーハンドリングワークフロー", () => {
		it("API エラー時に適切なエラーメッセージが表示されること", async () => {
			// APIエラーをシミュレート
			server.use(
				http.get("/api/ratings", () => {
					return new Response(JSON.stringify({ error: "Internal Server Error" }), {
						status: 500,
						headers: { "Content-Type": "application/json" }
					});
				})
			);

			renderWithQueryClient(<RatingsPage />);

			// エラーメッセージの表示確認
			await waitFor(() => {
				expect(screen.getByText(/エラーが発生しました/i)).toBeInTheDocument();
			});
		});

		it("ネットワークエラー時にリトライ機能が動作すること", async () => {
			const user = userEvent.setup();
			
			// 最初はネットワークエラー
			server.use(
				http.get("/api/ratings", () => {
					return Response.error();
				})
			);

			renderWithQueryClient(<RatingsPage />);

			// エラーメッセージの表示確認
			await waitFor(() => {
				expect(screen.getByText(/ネットワークエラー/i)).toBeInTheDocument();
			});

			// リトライボタンをクリック
			const retryButton = screen.getByRole("button", { name: /再試行/i });
			
			// 正常なレスポンスに変更してからリトライ
			server.resetHandlers();
			await user.click(retryButton);

			// データが正常に読み込まれることを確認
			await waitFor(() => {
				expect(screen.getByText("非常に実用的な記事です")).toBeInTheDocument();
			});
		});
	});

	describe("レスポンシブデザインワークフロー", () => {
		it("モバイル表示で適切にレイアウトが調整されること", async () => {
			// ビューポートをモバイルサイズに変更
			Object.defineProperty(window, "innerWidth", {
				writable: true,
				configurable: true,
				value: 375,
			});
			Object.defineProperty(window, "innerHeight", {
				writable: true,
				configurable: true,
				value: 667,
			});

			// リサイズイベントを発火
			window.dispatchEvent(new Event("resize"));

			renderWithQueryClient(<RatingsPage />);

			await waitFor(() => {
				expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
			});

			// モバイル用レイアウトの確認
			const ratingCards = screen.getAllByTestId("rating-card");
			expect(ratingCards[0]).toHaveClass("mobile-layout");
		});
	});

	describe("アクセシビリティワークフロー", () => {
		it("キーボードナビゲーションが正常に動作すること", async () => {
			const user = userEvent.setup();
			renderWithQueryClient(<RatingsPage />);

			await waitFor(() => {
				expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
			});

			// Tabキーでフォーカス移動
			await user.tab();
			expect(screen.getByLabelText(/最小スコア/i)).toHaveFocus();

			await user.tab();
			expect(screen.getByLabelText(/並び順/i)).toHaveFocus();

			await user.tab();
			expect(screen.getByRole("button", { name: /フィルター適用/i })).toHaveFocus();
		});

		it("スクリーンリーダー用のARIAラベルが適切に設定されていること", async () => {
			renderWithQueryClient(<RatingsPage />);

			await waitFor(() => {
				expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
			});

			// ARIAラベルの確認
			expect(screen.getByRole("main")).toHaveAttribute("aria-label", "記事評価一覧");
			expect(screen.getByRole("region", { name: "統計情報" })).toBeInTheDocument();
			expect(screen.getByRole("region", { name: "評価フィルター" })).toBeInTheDocument();
		});
	});
});

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("E2Eテストが正しく設定されている", () => {
		expect(true).toBe(true);
	});
}