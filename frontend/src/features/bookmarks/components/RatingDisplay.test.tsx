/**
 * RatingDisplayコンポーネントのテスト
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RatingDisplay } from "./RatingDisplay";

// 評価データのモック設定
let mockRatingData: {
	practicalValue: number;
	technicalDepth: number;
	understanding: number;
	novelty: number;
	importance: number;
	totalScore: number;
} | null = null;

vi.mock("@/features/ratings/queries/useArticleRating", () => ({
	useArticleRating: () => ({
		data: mockRatingData,
	}),
}));

const renderWithQueryClient = (component: React.ReactElement) => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return render(
		<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
	);
};

describe("RatingDisplay", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockRatingData = null; // 各テスト前にリセット
	});

	it("評価がある場合、評価を表示する", () => {
		// 評価データを設定
		mockRatingData = {
			practicalValue: 8,
			technicalDepth: 7,
			understanding: 9,
			novelty: 6,
			importance: 8,
			totalScore: 7.6,
		};

		renderWithQueryClient(<RatingDisplay bookmarkId={1} />);

		expect(screen.getByText("詳細")).toBeInTheDocument();
		expect(screen.getByTitle("評価詳細を見る")).toBeInTheDocument();
	});

	it("評価がない場合、未評価表示をする", () => {
		// 評価データをnullに設定（デフォルト）
		mockRatingData = null;

		renderWithQueryClient(<RatingDisplay bookmarkId={1} />);

		expect(screen.getByText("未評価")).toBeInTheDocument();
		expect(screen.getByText("📝")).toBeInTheDocument();
		expect(screen.getByTitle("Claude (MCP) で評価可能")).toBeInTheDocument();
	});

	it("評価詳細リンクが正しいURLを指している", () => {
		// 評価データを設定
		mockRatingData = {
			practicalValue: 8,
			technicalDepth: 7,
			understanding: 9,
			novelty: 6,
			importance: 8,
			totalScore: 7.6,
		};

		renderWithQueryClient(<RatingDisplay bookmarkId={123} />);

		const link = screen.getByTitle("評価詳細を見る");
		expect(link).toHaveAttribute("href", "/ratings?articleId=123");
	});
});
