import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { LabelCreateForm } from "./LabelCreateForm";

describe("LabelCreateForm", () => {
	test("フォームが正しく表示される", () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(<LabelCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

		expect(screen.getByText("ラベル名")).toBeInTheDocument();
		expect(screen.getByText("説明文")).toBeInTheDocument();
		expect(screen.getByText("キャンセル")).toBeInTheDocument();
		expect(screen.getByText("作成")).toBeInTheDocument();
	});

	test("ラベル名と説明を入力できる", () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(<LabelCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

		const nameInput = screen.getByPlaceholderText("例：react, typescript, aws");
		const descriptionInput = screen.getByPlaceholderText(
			"このラベルの説明（記事の分類に役立ちます）",
		);

		fireEvent.change(nameInput, { target: { value: "テストラベル" } });
		fireEvent.change(descriptionInput, { target: { value: "テスト説明" } });

		expect(nameInput).toHaveValue("テストラベル");
		expect(descriptionInput).toHaveValue("テスト説明");
	});

	test("有効な入力でフォーム送信できる", async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(<LabelCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

		const nameInput = screen.getByPlaceholderText("例：react, typescript, aws");
		const descriptionInput = screen.getByPlaceholderText(
			"このラベルの説明（記事の分類に役立ちます）",
		);
		const submitButton = screen.getByText("作成");

		fireEvent.change(nameInput, { target: { value: "テストラベル" } });
		fireEvent.change(descriptionInput, { target: { value: "テスト説明" } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalledWith("テストラベル", "テスト説明");
		});
	});

	test("空のラベル名でフォーム送信時にonSubmitが呼ばれない", () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(<LabelCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

		const submitButton = screen.getByText("作成");
		fireEvent.click(submitButton);

		// バリデーションによりonSubmitが呼ばれないことを確認
		expect(mockOnSubmit).not.toHaveBeenCalled();
	});

	test("キャンセルボタンクリックでonCancelが呼ばれる", () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(<LabelCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

		const cancelButton = screen.getByText("キャンセル");
		fireEvent.click(cancelButton);

		expect(mockOnCancel).toHaveBeenCalled();
	});

	test("送信中は送信ボタンが無効化される", () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(
			<LabelCreateForm
				onSubmit={mockOnSubmit}
				onCancel={mockOnCancel}
				isSubmitting={true}
			/>,
		);

		const submitButton = screen.getByText("作成中...");
		expect(submitButton).toBeDisabled();
	});

	test("エラーが表示される", () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();
		const error = new Error("作成に失敗しました");

		render(
			<LabelCreateForm
				onSubmit={mockOnSubmit}
				onCancel={mockOnCancel}
				error={error}
			/>,
		);

		expect(screen.getByText("作成に失敗しました")).toBeInTheDocument();
	});
});
