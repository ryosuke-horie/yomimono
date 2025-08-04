/**
 * AddBookModalコンポーネントのテスト
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddBookModal } from "./AddBookModal";

// モックフック
const mockMutate = vi.fn();
const mockUseCreateBook = vi.fn(() => ({
	mutate: mockMutate,
	isPending: false,
}));

vi.mock("../queries/useCreateBook", () => ({
	useCreateBook: () => mockUseCreateBook(),
}));

describe("AddBookModal", () => {
	const createWrapper = () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		return ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("モーダルが表示される", () => {
		render(<AddBookModal isOpen={true} onClose={vi.fn()} />, {
			wrapper: createWrapper(),
		});

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("本を追加")).toBeInTheDocument();
	});

	it("モーダルが非表示の場合は何も表示されない", () => {
		const { container } = render(
			<AddBookModal isOpen={false} onClose={vi.fn()} />,
			{ wrapper: createWrapper() },
		);

		expect(container.firstChild).toBeNull();
	});

	it("必須フィールドが存在する", () => {
		render(<AddBookModal isOpen={true} onClose={vi.fn()} />, {
			wrapper: createWrapper(),
		});

		expect(screen.getByLabelText("タイトル *")).toBeInTheDocument();
		expect(screen.getByLabelText("タイプ *")).toBeInTheDocument();
		// URLとimageUrlフィールドも確認
		expect(screen.getByLabelText("URL")).toBeInTheDocument();
		expect(screen.getByLabelText("表紙画像URL")).toBeInTheDocument();
	});

	it("タイプの選択肢が正しく表示される", () => {
		render(<AddBookModal isOpen={true} onClose={vi.fn()} />, {
			wrapper: createWrapper(),
		});

		const typeSelect = screen.getByLabelText(
			"タイプ *",
		) as unknown as HTMLSelectElement;
		const options = Array.from(typeSelect.options).map((option) => option.text);

		expect(options).toContain("書籍");
		expect(options).toContain("PDF");
		expect(options).toContain("GitHub");
		expect(options).toContain("Zenn");
	});

	it("フォーム送信が正しく動作する", async () => {
		const mockOnClose = vi.fn();

		render(<AddBookModal isOpen={true} onClose={mockOnClose} />, {
			wrapper: createWrapper(),
		});

		// フォーム入力
		const titleInput = screen.getByLabelText("タイトル *") as HTMLInputElement;
		const urlInput = screen.getByLabelText("URL") as HTMLInputElement;

		fireEvent.change(titleInput, { target: { value: "テスト本" } });
		fireEvent.change(urlInput, { target: { value: "https://example.com" } });

		// フォーム送信
		const form = screen.getByRole("dialog").querySelector("form");
		if (!form) throw new Error("Form not found");
		fireEvent.submit(form);

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "テスト本",
					type: "book",
					url: "https://example.com",
				}),
				expect.objectContaining({
					onSuccess: expect.any(Function),
				}),
			);
		});
	});

	it("キャンセルボタンでモーダルが閉じる", () => {
		const mockOnClose = vi.fn();

		render(<AddBookModal isOpen={true} onClose={mockOnClose} />, {
			wrapper: createWrapper(),
		});

		const cancelButton = screen.getByRole("button", { name: "キャンセル" });
		fireEvent.click(cancelButton);

		expect(mockOnClose).toHaveBeenCalled();
	});

	it("フォーム送信成功時にモーダルが閉じる", async () => {
		const mockOnClose = vi.fn();

		// mutateの実装をモック
		mockMutate.mockImplementation((_data, options) => {
			// onSuccessコールバックを呼び出す
			options.onSuccess();
		});

		render(<AddBookModal isOpen={true} onClose={mockOnClose} />, {
			wrapper: createWrapper(),
		});

		// フォーム入力
		const titleInput = screen.getByLabelText("タイトル *") as HTMLInputElement;
		fireEvent.change(titleInput, { target: { value: "テスト本" } });

		// フォーム送信
		const form = screen.getByRole("dialog").querySelector("form");
		if (!form) throw new Error("Form not found");
		fireEvent.submit(form);

		await waitFor(() => {
			expect(mockOnClose).toHaveBeenCalled();
		});
	});

	it("送信中は送信ボタンが無効化される", () => {
		// isPendingをtrueに設定
		mockUseCreateBook.mockReturnValue({
			mutate: mockMutate,
			isPending: true,
		});

		render(<AddBookModal isOpen={true} onClose={vi.fn()} />, {
			wrapper: createWrapper(),
		});

		const submitButton = screen.getByRole("button", { name: "追加中..." });
		expect(submitButton).toBeDisabled();

		// デフォルトに戻す
		mockUseCreateBook.mockReturnValue({
			mutate: mockMutate,
			isPending: false,
		});
	});

	it("各入力フィールドの値が正しく更新される", () => {
		render(<AddBookModal isOpen={true} onClose={vi.fn()} />, {
			wrapper: createWrapper(),
		});

		const titleInput = screen.getByLabelText("タイトル *") as HTMLInputElement;
		const typeSelect = screen.getByLabelText(
			"タイプ *",
		) as unknown as HTMLSelectElement;
		const urlInput = screen.getByLabelText("URL") as HTMLInputElement;
		const imageUrlInput = screen.getByLabelText(
			"表紙画像URL",
		) as HTMLInputElement;

		fireEvent.change(titleInput, { target: { value: "新しい本" } });
		fireEvent.change(typeSelect, { target: { value: "pdf" } });
		fireEvent.change(urlInput, {
			target: { value: "https://example.com/book.pdf" },
		});
		fireEvent.change(imageUrlInput, {
			target: { value: "https://example.com/cover.jpg" },
		});

		expect(titleInput.value).toBe("新しい本");
		expect(typeSelect.value).toBe("pdf");
		expect(urlInput.value).toBe("https://example.com/book.pdf");
		expect(imageUrlInput.value).toBe("https://example.com/cover.jpg");
	});
});
