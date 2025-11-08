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

	// 未使用ラベル一覧 UI は削除済み
});
