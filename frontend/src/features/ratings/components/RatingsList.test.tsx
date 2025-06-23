import { fireEvent, render, screen } from "@testing-library/react";
/**
 * RatingsListコンポーネントのテスト
 */
import { expect, test, vi } from "vitest";
import type { RatingWithArticle } from "../types";
import { RatingsList } from "./RatingsList";

if (import.meta.vitest) {
	const mockRatings: RatingWithArticle[] = [
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
				comment: "とても参考になる記事でした。実装例が豊富で理解しやすい。",
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-01T00:00:00Z",
			},
			article: {
				id: 123,
				url: "https://example.com/article1",
				title: "React Hooksの実践的な使い方",
				isRead: false,
				createdAt: "2022-12-01T00:00:00Z",
				updatedAt: "2022-12-01T00:00:00Z",
			},
		},
		{
			rating: {
				id: 2,
				articleId: 456,
				practicalValue: 6,
				technicalDepth: 9,
				understanding: 7,
				novelty: 8,
				importance: 7,
				totalScore: 74,
				comment: undefined,
				createdAt: "2023-01-02T00:00:00Z",
				updatedAt: "2023-01-02T00:00:00Z",
			},
			article: {
				id: 456,
				url: "https://example.com/article2",
				title: "TypeScript 高度な型システム",
				isRead: true,
				createdAt: "2022-12-02T00:00:00Z",
				updatedAt: "2022-12-02T00:00:00Z",
			},
		},
	];

	// navigator.clipboard.writeTextをモック
	Object.assign(navigator, {
		clipboard: {
			writeText: vi.fn(),
		},
	});

	test("評価一覧が正しく表示される", () => {
		render(<RatingsList ratings={mockRatings} />);

		// 記事タイトル
		expect(screen.getByText("React Hooksの実践的な使い方")).toBeInTheDocument();
		expect(screen.getByText("TypeScript 高度な型システム")).toBeInTheDocument();

		// URL
		expect(
			screen.getByText("https://example.com/article1"),
		).toBeInTheDocument();
		expect(
			screen.getByText("https://example.com/article2"),
		).toBeInTheDocument();

		// 総合スコア（StarRatingコンポーネント経由で表示）
		expect(screen.getByTitle("評価: 76.0/10")).toBeInTheDocument();
		expect(screen.getByTitle("評価: 74.0/10")).toBeInTheDocument();
	});

	test("評価軸詳細が正しく表示される", () => {
		render(<RatingsList ratings={mockRatings} />);

		// 評価軸のラベルが表示される（複数記事があるので複数回表示される）
		expect(screen.getAllByText("実用性")).toHaveLength(2);
		expect(screen.getAllByText("技術深度")).toHaveLength(2);
		expect(screen.getAllByText("理解度")).toHaveLength(2);
		expect(screen.getAllByText("新規性")).toHaveLength(2);
		expect(screen.getAllByText("重要度")).toHaveLength(2);

		// 評価スコアが表示される（テストデータに基づく実際の値）
		expect(screen.getAllByText("8")).toHaveLength(3); // 実用性8, 新規性8, 重要度8
		expect(screen.getAllByText("7")).toHaveLength(3); // 技術深度7, 理解度7, 重要度7
		expect(screen.getAllByText("9")).toHaveLength(2); // 理解度スコア9と技術深度スコア9
		expect(screen.getAllByText("6")).toHaveLength(2); // 新規性スコア6と実用性スコア6
	});

	test("コメントありの記事でコメントが表示される", () => {
		render(<RatingsList ratings={mockRatings} />);

		// コメントが表示される
		expect(
			screen.getByText(
				"とても参考になる記事でした。実装例が豊富で理解しやすい。",
			),
		).toBeInTheDocument();

		// コメント絵文字
		expect(screen.getByText("💭")).toBeInTheDocument();
	});

	test("コメントなしの記事ではコメント欄が表示されない", () => {
		render(<RatingsList ratings={[mockRatings[1]]} />);

		// 2番目の記事はコメントなしなので、コメント絵文字が表示されない
		expect(screen.queryByText("💭")).not.toBeInTheDocument();
	});

	test("既読・未読ステータスが正しく表示される", () => {
		render(<RatingsList ratings={mockRatings} />);

		// 未読記事
		expect(screen.getByText("未読")).toBeInTheDocument();

		// 既読記事
		expect(screen.getByText("既読")).toBeInTheDocument();
	});

	test("記事URLのコピー機能が動作する", async () => {
		render(<RatingsList ratings={[mockRatings[0]]} />);

		// コピーボタンをクリック
		const copyButtons = screen.getAllByTitle("URLをコピー");
		fireEvent.click(copyButtons[0]);

		// クリップボードへの書き込みが呼ばれる
		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
			"https://example.com/article1",
		);
	});

	test("ローディング状態が正しく表示される", () => {
		render(<RatingsList isLoading={true} />);

		// スケルトンローダーが表示される
		const skeletons = screen.getAllByRole("generic");
		expect(skeletons.length).toBeGreaterThan(0);

		// 実際の評価データは表示されない
		expect(
			screen.queryByText("React Hooksの実践的な使い方"),
		).not.toBeInTheDocument();
	});

	test("空の状態で適切なメッセージが表示される", () => {
		render(<RatingsList ratings={[]} />);

		// 空状態メッセージ
		expect(screen.getByText("評価済み記事がありません")).toBeInTheDocument();
		expect(
			screen.getByText((_content, element) => {
				return (
					element?.textContent ===
					"条件に一致する評価済み記事がありません。Claude (MCP) で記事を評価してください。"
				);
			}),
		).toBeInTheDocument();

		// MCPガイドが表示される
		expect(
			screen.getByText("📝 評価はClaude (MCP) で実行"),
		).toBeInTheDocument();
	});

	test("記事タイトルがリンクになっている", () => {
		render(<RatingsList ratings={[mockRatings[0]]} />);

		const titleLink = screen.getByText("React Hooksの実践的な使い方");
		expect(titleLink.closest("a")).toHaveAttribute(
			"href",
			"https://example.com/article1",
		);
		expect(titleLink.closest("a")).toHaveAttribute("target", "_blank");
		expect(titleLink.closest("a")).toHaveAttribute(
			"rel",
			"noopener noreferrer",
		);
	});

	test("記事詳細へのリンクが表示される", () => {
		render(<RatingsList ratings={[mockRatings[0]]} />);

		const detailLink = screen.getByText("記事詳細");
		expect(detailLink.closest("a")).toHaveAttribute(
			"href",
			"/bookmarks?id=123",
		);
	});

	test("記事IDが表示される", () => {
		render(<RatingsList ratings={[mockRatings[0]]} />);

		expect(screen.getByText("記事ID: 123")).toBeInTheDocument();
	});

	test("日付フォーマットが正しく表示される", () => {
		render(<RatingsList ratings={[mockRatings[0]]} />);

		// 日本語フォーマットで表示される（具体的な文字列は環境依存）
		expect(screen.getByText(/2022/)).toBeInTheDocument(); // 記事作成日
		expect(screen.getByText(/評価日:/)).toBeInTheDocument(); // 評価日
	});
}
