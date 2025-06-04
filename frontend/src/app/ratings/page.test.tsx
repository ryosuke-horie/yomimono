import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
/**
 * 評価別未読一覧ページのテスト
 */
import { expect, test, vi } from "vitest";
import RatingsPage from "./page";

if (import.meta.vitest) {
	const createWrapper = () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});

		return ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};

	test("ページタイトルが正しく表示される", () => {
		render(<RatingsPage />, { wrapper: createWrapper() });

		expect(screen.getByText("記事評価一覧")).toBeInTheDocument();
	});

	test("ローディング状態が正しく表示される", () => {
		const mockUseRatings = vi.fn().mockReturnValue({
			data: undefined,
			isLoading: true,
			error: null,
		});
		const mockUseRatingStats = vi.fn().mockReturnValue({
			data: undefined,
			isLoading: true,
			error: null,
		});

		vi.doMock("@/features/ratings/queries/useRatings", () => ({
			useRatings: mockUseRatings,
		}));
		vi.doMock("@/features/ratings/queries/useRatingStats", () => ({
			useRatingStats: mockUseRatingStats,
		}));

		render(<RatingsPage />, { wrapper: createWrapper() });

		// ローディング状態のコンポーネントが表示される
		expect(screen.getByText("記事評価一覧")).toBeInTheDocument();
	});

	test("エラー状態が正しく表示される", () => {
		const mockError = new Error("データの取得に失敗しました");
		const mockUseRatings = vi.fn().mockReturnValue({
			data: undefined,
			isLoading: false,
			error: mockError,
		});
		const mockUseRatingStats = vi.fn().mockReturnValue({
			data: undefined,
			isLoading: false,
			error: null,
		});

		vi.doMock("@/features/ratings/queries/useRatings", () => ({
			useRatings: mockUseRatings,
		}));
		vi.doMock("@/features/ratings/queries/useRatingStats", () => ({
			useRatingStats: mockUseRatingStats,
		}));

		render(<RatingsPage />, { wrapper: createWrapper() });

		expect(
			screen.getByText("データの読み込みに失敗しました"),
		).toBeInTheDocument();
		expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();
	});

	test("データが少ない場合の追加ガイドが表示される", () => {
		const mockStats = {
			totalCount: 3,
			averageScore: 7.5,
			averagePracticalValue: 7.8,
			averageTechnicalDepth: 7.2,
			averageUnderstanding: 7.9,
			averageNovelty: 6.5,
			averageImportance: 7.6,
			ratingsWithComments: 2,
		};

		const mockUseRatings = vi.fn().mockReturnValue({
			data: [],
			isLoading: false,
			error: null,
		});
		const mockUseRatingStats = vi.fn().mockReturnValue({
			data: mockStats,
			isLoading: false,
			error: null,
		});

		vi.doMock("@/features/ratings/queries/useRatings", () => ({
			useRatings: mockUseRatings,
		}));
		vi.doMock("@/features/ratings/queries/useRatingStats", () => ({
			useRatingStats: mockUseRatingStats,
		}));

		render(<RatingsPage />, { wrapper: createWrapper() });

		expect(
			screen.getByText("評価データを増やしませんか？"),
		).toBeInTheDocument();
		expect(screen.getByText("現在3件の評価があります。")).toBeInTheDocument();
	});

	test("データが十分にある場合は追加ガイドが表示されない", () => {
		const mockStats = {
			totalCount: 10,
			averageScore: 7.5,
			averagePracticalValue: 7.8,
			averageTechnicalDepth: 7.2,
			averageUnderstanding: 7.9,
			averageNovelty: 6.5,
			averageImportance: 7.6,
			ratingsWithComments: 8,
		};

		const mockRatings = [
			{
				rating: {
					id: 1,
					articleId: 123,
					practicalValue: 8,
					technicalDepth: 7,
					understanding: 9,
					novelty: 6,
					importance: 8,
					totalScore: 76,
					comment: "参考になりました",
					createdAt: "2023-01-01T00:00:00Z",
					updatedAt: "2023-01-01T00:00:00Z",
				},
				article: {
					id: 123,
					url: "https://example.com",
					title: "テスト記事",
					isRead: false,
					createdAt: "2023-01-01T00:00:00Z",
					updatedAt: "2023-01-01T00:00:00Z",
				},
			},
		];

		const mockUseRatings = vi.fn().mockReturnValue({
			data: mockRatings,
			isLoading: false,
			error: null,
		});
		const mockUseRatingStats = vi.fn().mockReturnValue({
			data: mockStats,
			isLoading: false,
			error: null,
		});

		vi.doMock("@/features/ratings/queries/useRatings", () => ({
			useRatings: mockUseRatings,
		}));
		vi.doMock("@/features/ratings/queries/useRatingStats", () => ({
			useRatingStats: mockUseRatingStats,
		}));

		render(<RatingsPage />, { wrapper: createWrapper() });

		expect(
			screen.queryByText("評価データを増やしませんか？"),
		).not.toBeInTheDocument();
	});

	test("空のデータの場合はMCPガイドが表示される", () => {
		const mockUseRatings = vi.fn().mockReturnValue({
			data: [],
			isLoading: false,
			error: null,
		});
		const mockUseRatingStats = vi.fn().mockReturnValue({
			data: null,
			isLoading: false,
			error: null,
		});

		vi.doMock("@/features/ratings/queries/useRatings", () => ({
			useRatings: mockUseRatings,
		}));
		vi.doMock("@/features/ratings/queries/useRatingStats", () => ({
			useRatingStats: mockUseRatingStats,
		}));

		render(<RatingsPage />, { wrapper: createWrapper() });

		// 空状態とMCPガイドが表示される
		expect(screen.getByText("評価済み記事がありません")).toBeInTheDocument();
	});
}
