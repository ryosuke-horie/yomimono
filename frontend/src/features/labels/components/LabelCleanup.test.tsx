/**
 * LabelCleanupコンポーネントのテスト
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LabelCleanup } from "./LabelCleanup";

describe("LabelCleanup", () => {
	it("未使用ラベルがない場合は何も表示しない", () => {
		const labels = [
			{ id: 1, name: "使用中ラベル", articleCount: 5 },
			{ id: 2, name: "別の使用中ラベル", articleCount: 3 },
		];
		const mockOnCleanup = vi.fn();

		const { container } = render(
			<LabelCleanup labels={labels} onCleanup={mockOnCleanup} />,
		);

		expect(container.firstChild).toBeNull();
	});

	it("未使用ラベルがある場合はクリーンアップセクションを表示", () => {
		const labels = [
			{ id: 1, name: "使用中ラベル", articleCount: 5 },
			{ id: 2, name: "未使用ラベル1", articleCount: 0 },
			{ id: 3, name: "未使用ラベル2", articleCount: 0 },
		];
		const mockOnCleanup = vi.fn();

		render(<LabelCleanup labels={labels} onCleanup={mockOnCleanup} />);

		expect(
			screen.getByText("未使用ラベルのクリーンアップ"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/2個の未使用ラベルが見つかりました/),
		).toBeInTheDocument();
		expect(
			screen.getByText("未使用ラベル一覧を表示 (2個)"),
		).toBeInTheDocument();
	});

	it("articleCountがundefinedの場合も未使用として扱う", () => {
		const labels = [
			{ id: 1, name: "使用中ラベル", articleCount: 5 },
			{ id: 2, name: "未使用ラベル", articleCount: undefined },
		];
		const mockOnCleanup = vi.fn();

		render(<LabelCleanup labels={labels} onCleanup={mockOnCleanup} />);

		expect(
			screen.getByText("未使用ラベルのクリーンアップ"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/1個の未使用ラベルが見つかりました/),
		).toBeInTheDocument();
	});

	it("ローディング状態を正しく表示", () => {
		const labels = [{ id: 1, name: "未使用ラベル", articleCount: 0 }];
		const mockOnCleanup = vi.fn();

		render(
			<LabelCleanup
				labels={labels}
				onCleanup={mockOnCleanup}
				isLoading={true}
			/>,
		);

		expect(screen.getByText("削除中...")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "削除中..." })).toBeDisabled();
	});

	it("エラー状態を正しく表示", () => {
		const labels = [{ id: 1, name: "未使用ラベル", articleCount: 0 }];
		const mockOnCleanup = vi.fn();
		const error = new Error("削除に失敗しました");

		render(
			<LabelCleanup labels={labels} onCleanup={mockOnCleanup} error={error} />,
		);

		expect(screen.getByText("削除に失敗しました")).toBeInTheDocument();
	});

	it("注意書きが表示される", () => {
		const labels = [{ id: 1, name: "未使用ラベル", articleCount: 0 }];
		const mockOnCleanup = vi.fn();

		render(<LabelCleanup labels={labels} onCleanup={mockOnCleanup} />);

		expect(
			screen.getByText(
				/※「未使用ラベルを削除」ボタンを押すと確認なしで即時に削除が実行されます。/,
			),
		).toBeInTheDocument();
	});

	it("削除ボタンを押すと即座にonCleanupが呼ばれる", async () => {
		const labels = [{ id: 1, name: "未使用ラベル", articleCount: 0 }];
		const mockOnCleanup = vi.fn();
		const user = userEvent.setup();

		render(<LabelCleanup labels={labels} onCleanup={mockOnCleanup} />);

		const deleteButton = screen.getByRole("button", {
			name: "未使用ラベルを削除",
		});
		await user.click(deleteButton);

		expect(mockOnCleanup).toHaveBeenCalledTimes(1);
	});

	it("未使用ラベル一覧の詳細を展開して表示できる", async () => {
		const labels = [
			{ id: 1, name: "未使用ラベル1", articleCount: 0, description: "説明1" },
			{ id: 2, name: "未使用ラベル2", articleCount: 0 },
		];
		const mockOnCleanup = vi.fn();
		const user = userEvent.setup();

		render(<LabelCleanup labels={labels} onCleanup={mockOnCleanup} />);

		// 詳細を展開
		const summary = screen.getByText("未使用ラベル一覧を表示 (2個)");
		await user.click(summary);

		expect(screen.getByText("• 未使用ラベル1")).toBeInTheDocument();
		expect(screen.getByText("• 未使用ラベル2")).toBeInTheDocument();
		expect(screen.getByText("(説明1)")).toBeInTheDocument();
	});

	it("長い説明文は50文字で切り詰めて表示される", async () => {
		const longDescription =
			"これは非常に長い説明文で、50文字を超えるため切り詰められて表示されるはずです。追加のテキストを含めて確実に50文字を超えるようにします。";
		const labels = [
			{
				id: 1,
				name: "未使用ラベル",
				articleCount: 0,
				description: longDescription,
			},
		];
		const mockOnCleanup = vi.fn();
		const user = userEvent.setup();

		render(<LabelCleanup labels={labels} onCleanup={mockOnCleanup} />);

		// 詳細を展開
		const summary = screen.getByText("未使用ラベル一覧を表示 (1個)");
		await user.click(summary);

		// 最初の50文字 + "..." が表示される
		const truncatedText = `${longDescription.substring(0, 50)}...`;
		expect(screen.getByText(`(${truncatedText})`)).toBeInTheDocument();
	});
});
