import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
	test("ダイアログが開いている時に表示される", () => {
		const mockOnClose = vi.fn();
		const mockOnConfirm = vi.fn();

		render(
			<ConfirmDialog
				isOpen={true}
				onClose={mockOnClose}
				onConfirm={mockOnConfirm}
				title="確認ダイアログ"
				message="本当に削除しますか？"
			/>,
		);

		expect(screen.getByText("確認ダイアログ")).toBeInTheDocument();
		expect(screen.getByText("本当に削除しますか？")).toBeInTheDocument();
		expect(screen.getByText("削除")).toBeInTheDocument();
		expect(screen.getByText("キャンセル")).toBeInTheDocument();
	});

	test("ダイアログが閉じている時は表示されない", () => {
		const mockOnClose = vi.fn();
		const mockOnConfirm = vi.fn();

		render(
			<ConfirmDialog
				isOpen={false}
				onClose={mockOnClose}
				onConfirm={mockOnConfirm}
				title="確認ダイアログ"
				message="本当に削除しますか？"
			/>,
		);

		expect(screen.queryByText("確認ダイアログ")).not.toBeInTheDocument();
		expect(screen.queryByText("本当に削除しますか？")).not.toBeInTheDocument();
	});

	test("確認ボタンクリックでonConfirmが呼ばれる", () => {
		const mockOnClose = vi.fn();
		const mockOnConfirm = vi.fn();

		render(
			<ConfirmDialog
				isOpen={true}
				onClose={mockOnClose}
				onConfirm={mockOnConfirm}
				title="確認ダイアログ"
				message="本当に削除しますか？"
			/>,
		);

		const confirmButton = screen.getByText("削除");
		fireEvent.click(confirmButton);

		expect(mockOnConfirm).toHaveBeenCalled();
	});

	test("キャンセルボタンクリックでonCloseが呼ばれる", () => {
		const mockOnClose = vi.fn();
		const mockOnConfirm = vi.fn();

		render(
			<ConfirmDialog
				isOpen={true}
				onClose={mockOnClose}
				onConfirm={mockOnConfirm}
				title="確認ダイアログ"
				message="本当に削除しますか？"
			/>,
		);

		const cancelButton = screen.getByText("キャンセル");
		fireEvent.click(cancelButton);

		expect(mockOnClose).toHaveBeenCalled();
	});

	test("カスタムボタンテキストが表示される", () => {
		const mockOnClose = vi.fn();
		const mockOnConfirm = vi.fn();

		render(
			<ConfirmDialog
				isOpen={true}
				onClose={mockOnClose}
				onConfirm={mockOnConfirm}
				title="確認ダイアログ"
				message="本当に削除しますか？"
				confirmText="実行"
				cancelText="やめる"
			/>,
		);

		expect(screen.getByText("実行")).toBeInTheDocument();
		expect(screen.getByText("やめる")).toBeInTheDocument();
	});

	test("ローディング中は確認ボタンが無効化される", () => {
		const mockOnClose = vi.fn();
		const mockOnConfirm = vi.fn();

		render(
			<ConfirmDialog
				isOpen={true}
				onClose={mockOnClose}
				onConfirm={mockOnConfirm}
				title="確認ダイアログ"
				message="本当に削除しますか？"
				isLoading={true}
			/>,
		);

		const confirmButton = screen.getByText("処理中...");
		expect(confirmButton).toBeDisabled();
	});
});
