import { render, screen } from "@testing-library/react";
/**
 * RatingStatsSummaryコンポーネントのテスト
 */
import { expect, test } from "vitest";
import type { RatingStats } from "../types";
import { RatingStatsSummary } from "./RatingStatsSummary";

if (import.meta.vitest) {
	const mockStats: RatingStats = {
		totalCount: 150,
		averageScore: 7.8,
		averagePracticalValue: 8.2,
		averageTechnicalDepth: 7.5,
		averageUnderstanding: 8.0,
		averageNovelty: 6.8,
		averageImportance: 7.9,
		ratingsWithComments: 120,
	};

	test("統計データが正しく表示される", () => {
		render(<RatingStatsSummary stats={mockStats} />);

		// メインタイトル
		expect(screen.getByText("評価統計サマリー")).toBeInTheDocument();

		// 総評価数
		expect(screen.getByText("総評価数")).toBeInTheDocument();
		expect(screen.getByText("150")).toBeInTheDocument();

		// 平均スコア
		expect(screen.getByText("平均スコア")).toBeInTheDocument();
		expect(screen.getByText("7.8")).toBeInTheDocument();
		expect(screen.getByText("/10")).toBeInTheDocument();

		// コメント付き評価
		expect(screen.getByText("コメント付き")).toBeInTheDocument();
		expect(screen.getByText("120")).toBeInTheDocument();
		expect(screen.getByText("(80.0%)")).toBeInTheDocument();
	});

	test("評価軸別平均スコアが表示される", () => {
		render(<RatingStatsSummary stats={mockStats} />);

		// 評価軸セクション
		expect(screen.getByText("評価軸別平均スコア")).toBeInTheDocument();

		// 各評価軸
		expect(screen.getByText("実用性")).toBeInTheDocument();
		expect(screen.getByText("8.2")).toBeInTheDocument();

		expect(screen.getByText("技術深度")).toBeInTheDocument();
		expect(screen.getByText("7.5")).toBeInTheDocument();

		expect(screen.getByText("理解度")).toBeInTheDocument();
		expect(screen.getByText("8.0")).toBeInTheDocument();

		expect(screen.getByText("新規性")).toBeInTheDocument();
		expect(screen.getByText("6.8")).toBeInTheDocument();

		expect(screen.getByText("重要度")).toBeInTheDocument();
		expect(screen.getByText("7.9")).toBeInTheDocument();
	});

	test("最高評価軸が正しく表示される", () => {
		render(<RatingStatsSummary stats={mockStats} />);

		// 実用性が最高評価軸（8.2）
		expect(screen.getByText("最高評価軸")).toBeInTheDocument();
		expect(screen.getByText("実用性")).toBeInTheDocument();
		expect(screen.getByText("(8.2)")).toBeInTheDocument();
	});

	test("ローディング状態が正しく表示される", () => {
		render(<RatingStatsSummary isLoading={true} />);

		// スケルトンローダーが表示される
		const skeletons = screen.getAllByRole("generic");
		expect(skeletons.length).toBeGreaterThan(0);

		// 実際の統計データは表示されない
		expect(screen.queryByText("評価統計サマリー")).not.toBeInTheDocument();
	});

	test("統計データがない場合のメッセージが表示される", () => {
		render(<RatingStatsSummary stats={undefined} />);

		expect(
			screen.getByText("統計情報を読み込めませんでした"),
		).toBeInTheDocument();
	});

	test("評価数が0の場合のパーセンテージ計算", () => {
		const emptyStats: RatingStats = {
			...mockStats,
			totalCount: 0,
			ratingsWithComments: 0,
		};

		render(<RatingStatsSummary stats={emptyStats} />);

		// パーセンテージが表示されない
		expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
	});

	test("統計カードにアイコンが表示される", () => {
		render(<RatingStatsSummary stats={mockStats} />);

		// 各カードのアイコンが存在することを確認
		const icons = ["📊", "⭐", "💬", "🏆"];
		for (const icon of icons) {
			expect(screen.getByText(icon)).toBeInTheDocument();
		}
	});
}
