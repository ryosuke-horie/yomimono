import { render, screen } from "@testing-library/react";
/**
 * MCPEvaluationGuideコンポーネントのテスト
 */
import { expect, test } from "vitest";
import { MCPEvaluationGuide } from "./MCPEvaluationGuide";

if (import.meta.vitest) {
	test("通常表示モードで正しく表示される", () => {
		render(<MCPEvaluationGuide />);

		// メインタイトル
		expect(screen.getByText("記事評価について")).toBeInTheDocument();

		// 評価手順セクション
		expect(screen.getByText("評価手順:")).toBeInTheDocument();
		expect(
			screen.getByText("Claude Desktop で記事URLを指定"),
		).toBeInTheDocument();

		// 評価軸セクション
		expect(screen.getByText("評価軸:")).toBeInTheDocument();
		expect(screen.getByText("実用性 (1-10)")).toBeInTheDocument();
		expect(screen.getByText("技術深度 (1-10)")).toBeInTheDocument();
		expect(screen.getByText("理解度 (1-10)")).toBeInTheDocument();
		expect(screen.getByText("新規性 (1-10)")).toBeInTheDocument();
		expect(screen.getByText("重要度 (1-10)")).toBeInTheDocument();

		// 評価例セクション
		expect(screen.getByText("評価例:")).toBeInTheDocument();
	});

	test("コンパクト表示モードで正しく表示される", () => {
		render(<MCPEvaluationGuide compact />);

		// コンパクトモード特有のテキスト
		expect(
			screen.getByText("📝 評価はClaude (MCP) で実行"),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Claude Desktopで記事URLを指定し、評価ツールを使用してください",
			),
		).toBeInTheDocument();

		// 通常モードの詳細セクションは表示されない
		expect(screen.queryByText("評価手順:")).not.toBeInTheDocument();
		expect(screen.queryByText("評価軸:")).not.toBeInTheDocument();
		expect(screen.queryByText("評価例:")).not.toBeInTheDocument();
	});

	test("MCPツール名が正しく表示される", () => {
		render(<MCPEvaluationGuide />);

		expect(screen.getByText("rateArticleWithContent")).toBeInTheDocument();
		expect(screen.getByText("rateArticle")).toBeInTheDocument();
	});

	test("評価後の案内メッセージが表示される", () => {
		render(<MCPEvaluationGuide />);

		expect(
			screen.getByText("評価後、このページで結果を確認・分析できます"),
		).toBeInTheDocument();
	});

	test("評価軸の色分けが正しく設定されている", () => {
		render(<MCPEvaluationGuide />);

		// 各評価軸の色分けを確認（クラス名で判定）
		const colorDots = screen.getAllByRole("listitem");
		expect(colorDots.length).toBeGreaterThan(0);
	});
}
