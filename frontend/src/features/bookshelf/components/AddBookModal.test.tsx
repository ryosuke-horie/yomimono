/**
 * AddBookModalコンポーネントのテスト
 */

import { vi } from "vitest";
import { expect, render, screen, test, user, waitFor } from "@/test-utils";
import { AddBookModal } from "./AddBookModal";

// モックフック
vi.mock("../hooks/useBookshelf", () => ({
	useBookshelf: vi.fn(() => ({
		addBook: vi.fn(),
	})),
}));

test("モーダルが表示される", () => {
	render(<AddBookModal isOpen={true} onClose={vi.fn()} />);

	expect(screen.getByRole("dialog")).toBeInTheDocument();
	expect(screen.getByText("本を追加")).toBeInTheDocument();
});

test("必須フィールドが存在する", () => {
	render(<AddBookModal isOpen={true} onClose={vi.fn()} />);

	expect(screen.getByLabelText("タイトル *")).toBeInTheDocument();
	expect(screen.getByLabelText("タイプ *")).toBeInTheDocument();
	expect(screen.getByLabelText("ステータス *")).toBeInTheDocument();
});

test("フォーム送信が正しく動作する", async () => {
	const { useBookshelf } = await import("../hooks/useBookshelf");
	const mockAddBook = vi.fn();
	const mockOnClose = vi.fn();

	// @ts-expect-error - モック用の型アサーション
	(useBookshelf as jest.Mock).mockReturnValue({
		addBook: mockAddBook,
	});

	render(<AddBookModal isOpen={true} onClose={mockOnClose} />);

	// フォーム入力
	await user.type(screen.getByLabelText("タイトル *"), "テスト本");
	await user.type(screen.getByLabelText("著者"), "テスト著者");

	// 送信
	await user.click(screen.getByRole("button", { name: "追加" }));

	await waitFor(() => {
		expect(mockAddBook).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "テスト本",
				author: "テスト著者",
			}),
		);
		expect(mockOnClose).toHaveBeenCalled();
	});
});

test("キャンセルボタンでモーダルが閉じる", async () => {
	const mockOnClose = vi.fn();

	render(<AddBookModal isOpen={true} onClose={mockOnClose} />);

	await user.click(screen.getByRole("button", { name: "キャンセル" }));

	expect(mockOnClose).toHaveBeenCalled();
});
