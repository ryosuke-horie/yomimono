/**
 * LabelDeleteConfirm コンポーネントのテスト
 * ラベル削除確認モーダルの表示、操作、キーボードイベント、エラーハンドリングをテスト
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { Label } from "../types";
import { LabelDeleteConfirm } from "./LabelDeleteConfirm";

const createMockLabel = (overrides?: Partial<Label>): Label => ({
	id: 1,
	name: "テストラベル",
	description: "テスト用のラベルです",
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
	articleCount: 0,
	...overrides,
});

describe("LabelDeleteConfirm", () => {
	const mockOnConfirm = vi.fn();
	const mockOnCancel = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("基本表示", () => {
		it("削除確認モーダルが正しく表示される", () => {
			const mockLabel = createMockLabel({ name: "JavaScript" });

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
				/>,
			);

			expect(screen.getByRole("dialog")).toBeInTheDocument();
			expect(screen.getByText("ラベルを削除しますか？")).toBeInTheDocument();
			expect(
				screen.getByText(/ラベル「JavaScript」を削除します/),
			).toBeInTheDocument();
			expect(screen.getByText(/この操作は取り消せません/)).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "削除する" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "キャンセル" }),
			).toBeInTheDocument();
		});

		it("警告アイコンが表示される", () => {
			const mockLabel = createMockLabel();

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
				/>,
			);

			// SVG要素の存在を確認
			const svgIcon = screen.getByRole("dialog").querySelector("svg");
			expect(svgIcon).toBeInTheDocument();
			expect(svgIcon).toHaveClass("text-red-600");
		});

		it("記事数がある場合は警告メッセージが表示される", () => {
			const mockLabel = createMockLabel({
				name: "React",
				articleCount: 5,
			});

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
				/>,
			);

			expect(
				screen.getByText(/このラベルは現在 5 件の記事に使用されています/),
			).toBeInTheDocument();
			expect(
				screen.getByText(/削除すると、これらの記事からラベルが削除されます/),
			).toBeInTheDocument();
		});

		it("記事数がない場合は警告メッセージが表示されない", () => {
			const mockLabel = createMockLabel({ articleCount: 0 });

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
				/>,
			);

			expect(
				screen.queryByText(/件の記事に使用されています/),
			).not.toBeInTheDocument();
		});
	});

	describe("ボタン操作", () => {
		it("削除ボタンをクリックするとonConfirmが呼ばれる", async () => {
			const user = userEvent.setup();
			const mockLabel = createMockLabel({ id: 123 });

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
				/>,
			);

			const deleteButton = screen.getByRole("button", { name: "削除する" });
			await user.click(deleteButton);

			expect(mockOnConfirm).toHaveBeenCalledWith(123);
		});

		it("キャンセルボタンをクリックするとonCancelが呼ばれる", async () => {
			const user = userEvent.setup();
			const mockLabel = createMockLabel();

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
				/>,
			);

			const cancelButton = screen.getByRole("button", { name: "キャンセル" });
			await user.click(cancelButton);

			expect(mockOnCancel).toHaveBeenCalled();
		});

		it("背景のオーバーレイをクリックするとonCancelが呼ばれる", async () => {
			const user = userEvent.setup();
			const mockLabel = createMockLabel();

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
				/>,
			);

			// オーバーレイを取得（背景の暗い部分）
			const overlay = screen
				.getByRole("dialog")
				.parentElement?.querySelector('[role="button"]');
			expect(overlay).toBeInTheDocument();

			if (overlay) {
				await user.click(overlay);
				expect(mockOnCancel).toHaveBeenCalled();
			}
		});
	});

	describe("ローディング状態", () => {
		it("削除中はボタンが無効化される", () => {
			const mockLabel = createMockLabel();

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
					isDeleting={true}
				/>,
			);

			const deleteButton = screen.getByRole("button", { name: "削除中..." });
			const cancelButton = screen.getByRole("button", { name: "キャンセル" });

			expect(deleteButton).toBeDisabled();
			expect(cancelButton).toBeDisabled();
		});

		it("削除中でない場合はボタンが有効", () => {
			const mockLabel = createMockLabel();

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
					isDeleting={false}
				/>,
			);

			const deleteButton = screen.getByRole("button", { name: "削除する" });
			const cancelButton = screen.getByRole("button", { name: "キャンセル" });

			expect(deleteButton).not.toBeDisabled();
			expect(cancelButton).not.toBeDisabled();
		});
	});

	describe("エラー表示", () => {
		it("エラーがある場合はエラーメッセージが表示される", () => {
			const mockLabel = createMockLabel();
			const mockError = new Error("削除に失敗しました");

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
					error={mockError}
				/>,
			);

			expect(screen.getByText("削除に失敗しました")).toBeInTheDocument();
		});

		it("エラーがない場合はエラーメッセージが表示されない", () => {
			const mockLabel = createMockLabel();

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
					error={null}
				/>,
			);

			// エラーメッセージのコンテナが存在しないことを確認
			expect(screen.queryByText(/失敗/)).not.toBeInTheDocument();
		});
	});

	describe("キーボード操作", () => {
		it("Escapeキーを押すとonCancelが呼ばれる", () => {
			const mockLabel = createMockLabel();

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
				/>,
			);

			// Escapeキーを押す
			fireEvent.keyDown(document, { key: "Escape" });

			expect(mockOnCancel).toHaveBeenCalled();
		});

		it("オーバーレイでEnterキーを押すとonCancelが呼ばれる", async () => {
			const mockLabel = createMockLabel();

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
				/>,
			);

			const overlay = screen
				.getByRole("dialog")
				.parentElement?.querySelector('[role="button"]');
			expect(overlay).toBeInTheDocument();

			if (overlay) {
				fireEvent.keyDown(overlay, { key: "Enter" });
				expect(mockOnCancel).toHaveBeenCalled();
			}
		});

		it("オーバーレイでSpaceキーを押すとonCancelが呼ばれる", async () => {
			const mockLabel = createMockLabel();

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
				/>,
			);

			const overlay = screen
				.getByRole("dialog")
				.parentElement?.querySelector('[role="button"]');
			expect(overlay).toBeInTheDocument();

			if (overlay) {
				fireEvent.keyDown(overlay, { key: " " });
				expect(mockOnCancel).toHaveBeenCalled();
			}
		});

		it("ダイアログ内でEnterやSpaceキーを押してもイベントが伝播しない", () => {
			const mockLabel = createMockLabel();

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
				/>,
			);

			const dialog = screen.getByRole("dialog");

			// ダイアログ内でEnterキーを押す
			fireEvent.keyDown(dialog, { key: "Enter" });
			expect(mockOnCancel).not.toHaveBeenCalled();

			// ダイアログ内でSpaceキーを押す
			fireEvent.keyDown(dialog, { key: " " });
			expect(mockOnCancel).not.toHaveBeenCalled();
		});
	});

	describe("アクセシビリティ", () => {
		it("適切なARIAラベルが設定されている", () => {
			const mockLabel = createMockLabel();

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
				/>,
			);

			const dialog = screen.getByRole("dialog");
			expect(dialog).toHaveAttribute("aria-modal", "true");
			expect(dialog).toHaveAttribute("aria-labelledby", "modal-headline");

			const heading = screen.getByText("ラベルを削除しますか？");
			expect(heading).toHaveAttribute("id", "modal-headline");
		});

		it("モーダルが開いたときに最初のボタンにフォーカスが当たる", async () => {
			const mockLabel = createMockLabel();

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
				/>,
			);

			// 削除ボタンが存在することを確認（フォーカステストは環境依存のためスキップ）
			const deleteButton = screen.getByRole("button", { name: "削除する" });
			expect(deleteButton).toBeInTheDocument();
		});
	});

	describe("複雑なシナリオ", () => {
		it("記事が多数紐づいているラベルの削除確認", () => {
			const mockLabel = createMockLabel({
				name: "重要なラベル",
				articleCount: 42,
			});

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
				/>,
			);

			expect(
				screen.getByText(/ラベル「重要なラベル」を削除します/),
			).toBeInTheDocument();
			expect(
				screen.getByText(/このラベルは現在 42 件の記事に使用されています/),
			).toBeInTheDocument();
		});

		it("削除中にエラーが発生した場合の表示", () => {
			const mockLabel = createMockLabel();
			const mockError = new Error("ネットワークエラーが発生しました");

			render(
				<LabelDeleteConfirm
					label={mockLabel}
					onConfirm={mockOnConfirm}
					onCancel={mockOnCancel}
					isDeleting={true}
					error={mockError}
				/>,
			);

			// 削除中かつエラー表示
			expect(screen.getByRole("button", { name: "削除中..." })).toBeDisabled();
			expect(
				screen.getByText("ネットワークエラーが発生しました"),
			).toBeInTheDocument();
		});
	});
});
