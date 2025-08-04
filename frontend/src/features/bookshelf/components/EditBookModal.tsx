/**
 * 本編集モーダルコンポーネント
 * 既存の本の情報を編集するモーダル
 */

"use client";

import { useUpdateBook } from "../queries/useUpdateBook";
import type { Book, UpdateBookInput } from "../types";
import { BookForm } from "./BookForm";

interface EditBookModalProps {
	book: Book | null;
	isOpen: boolean;
	onClose: () => void;
}

export function EditBookModal({ book, isOpen, onClose }: EditBookModalProps) {
	const updateBook = useUpdateBook();

	if (!isOpen || !book) return null;

	const handleSubmit = (data: UpdateBookInput) => {
		updateBook.mutate(
			{ id: book.id, data },
			{
				onSuccess: () => {
					onClose();
				},
			},
		);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div
				className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
				role="dialog"
				aria-labelledby="modal-title"
			>
				<h2 id="modal-title" className="text-xl font-bold mb-4">
					本を編集
				</h2>
				<BookForm
					book={book}
					onSubmit={handleSubmit}
					onCancel={onClose}
					isSubmitting={updateBook.isPending}
				/>
			</div>
		</div>
	);
}

if (import.meta.vitest) {
	const { describe, it, expect, vi } = import.meta.vitest;
	const { render, screen, fireEvent, waitFor } = await import(
		"@testing-library/react"
	);
	const React = await import("react");

	// useUpdateBookのモック
	vi.mock("../queries/useUpdateBook", () => ({
		useUpdateBook: vi.fn(() => ({
			mutate: vi.fn(),
			isPending: false,
		})),
	}));

	// BookFormのモック - Reactはモック外でインポートし、内部で使用
	vi.mock("./BookForm", async () => {
		const React = await import("react");
		return {
			BookForm: vi.fn(({ onSubmit, onCancel, book, isSubmitting }) =>
				React.createElement("div", { "data-testid": "book-form" }, [
					React.createElement("div", { key: "title" }, book?.title || ""),
					React.createElement(
						"button",
						{
							key: "submit",
							onClick: () => onSubmit({ title: "Updated Title" }),
							disabled: isSubmitting,
							"data-testid": "submit-button",
						},
						isSubmitting ? "更新中..." : "更新",
					),
					React.createElement(
						"button",
						{
							key: "cancel",
							onClick: onCancel,
							"data-testid": "cancel-button",
						},
						"キャンセル",
					),
				]),
			),
		};
	});

	describe("EditBookModal", () => {
		const mockBook: Book = {
			id: 1,
			type: "book",
			title: "テスト書籍",
			url: "https://example.com",
			imageUrl: "https://example.com/image.jpg",
			status: "unread",
			progress: 0,
			completedAt: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		it("isOpenがfalseの場合は何も表示されない", () => {
			const mockOnClose = vi.fn();
			const { container } = render(
				React.createElement(EditBookModal, {
					book: mockBook,
					isOpen: false,
					onClose: mockOnClose,
				}),
			);

			expect(container.firstChild).toBeNull();
		});

		it("bookがnullの場合は何も表示されない", () => {
			const mockOnClose = vi.fn();
			const { container } = render(
				React.createElement(EditBookModal, {
					book: null,
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			expect(container.firstChild).toBeNull();
		});

		it("isOpenがtrueでbookが存在する場合はモーダルが表示される", () => {
			const mockOnClose = vi.fn();
			render(
				React.createElement(EditBookModal, {
					book: mockBook,
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			expect(screen.getByRole("dialog")).toBeInTheDocument();
			expect(screen.getByText("本を編集")).toBeInTheDocument();
			expect(screen.getByTestId("book-form")).toBeInTheDocument();
		});

		it("BookFormに正しいpropsが渡される", async () => {
			const mockOnClose = vi.fn();
			const { BookForm } = await import("./BookForm");

			render(
				React.createElement(EditBookModal, {
					book: mockBook,
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			expect(BookForm).toHaveBeenCalledWith(
				expect.objectContaining({
					book: mockBook,
					onCancel: mockOnClose,
					isSubmitting: false,
					onSubmit: expect.any(Function),
				}),
				undefined,
			);
		});

		it("フォーム送信時にupdateBook.mutateが呼ばれる", async () => {
			const mockMutate = vi.fn();
			const mockOnClose = vi.fn();

			const { useUpdateBook } = await import("../queries/useUpdateBook");
			(useUpdateBook as ReturnType<typeof vi.fn>).mockReturnValue({
				mutate: mockMutate,
				isPending: false,
			});

			render(
				React.createElement(EditBookModal, {
					book: mockBook,
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			const submitButton = screen.getByTestId("submit-button");
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(mockMutate).toHaveBeenCalledWith(
					{
						id: 1,
						data: { title: "Updated Title" },
					},
					expect.objectContaining({
						onSuccess: expect.any(Function),
					}),
				);
			});
		});

		it("成功時にonCloseが呼ばれる", async () => {
			const mockOnClose = vi.fn();
			const mockMutate = vi.fn((_data, options) => {
				// onSuccessコールバックを呼び出す
				options.onSuccess();
			});

			const { useUpdateBook } = await import("../queries/useUpdateBook");
			(useUpdateBook as ReturnType<typeof vi.fn>).mockReturnValue({
				mutate: mockMutate,
				isPending: false,
			});

			render(
				React.createElement(EditBookModal, {
					book: mockBook,
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			const submitButton = screen.getByTestId("submit-button");
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(mockOnClose).toHaveBeenCalled();
			});
		});

		it("更新中はボタンが無効化される", async () => {
			const mockOnClose = vi.fn();

			const { useUpdateBook } = await import("../queries/useUpdateBook");
			(useUpdateBook as ReturnType<typeof vi.fn>).mockReturnValue({
				mutate: vi.fn(),
				isPending: true,
			});

			render(
				React.createElement(EditBookModal, {
					book: mockBook,
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			const submitButton = screen.getByTestId(
				"submit-button",
			) as HTMLButtonElement;
			expect(submitButton).toBeDisabled();
			expect(submitButton.textContent).toBe("更新中...");
		});

		it("キャンセルボタンクリックでonCloseが呼ばれる", () => {
			const mockOnClose = vi.fn();
			render(
				React.createElement(EditBookModal, {
					book: mockBook,
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			const cancelButton = screen.getByTestId("cancel-button");
			fireEvent.click(cancelButton);

			expect(mockOnClose).toHaveBeenCalled();
		});
	});
}
