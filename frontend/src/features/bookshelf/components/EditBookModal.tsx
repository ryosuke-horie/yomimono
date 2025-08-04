/**
 * 本編集モーダルコンポーネント
 * 既存の本の情報を編集するモーダル
 */

"use client";

import { useUpdateBook } from "../queries/useUpdateBook";
import type { Book, CreateBookInput } from "../types";
import { BookForm } from "./BookForm";

interface EditBookModalProps {
	isOpen: boolean;
	onClose: () => void;
	book: Book;
}

export function EditBookModal({ isOpen, onClose, book }: EditBookModalProps) {
	const updateBook = useUpdateBook();

	if (!isOpen) return null;

	const handleSubmit = (formData: CreateBookInput) => {
		updateBook.mutate(
			{
				id: book.id,
				...formData,
			},
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
					initialData={book}
					onSubmit={handleSubmit}
					submitLabel="更新"
					isSubmitting={updateBook.isPending}
				/>

				<div className="flex justify-end mt-4">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
					>
						キャンセル
					</button>
				</div>
			</div>
		</div>
	);
}

if (import.meta.vitest) {
	const { describe, it, expect, vi, beforeEach } = import.meta.vitest;
	const { render, screen, fireEvent, waitFor } = await import(
		"@testing-library/react"
	);
	const React = await import("react");
	const { BookType } = await import("../types");

	// useUpdateBookのモック
	vi.mock("../queries/useUpdateBook", () => ({
		useUpdateBook: vi.fn(() => ({
			mutate: vi.fn(),
			isPending: false,
		})),
	}));

	// BookFormのモック
	vi.mock("./BookForm", async () => {
		const actualReact = await vi.importActual("react");
		return {
			BookForm: vi.fn(
				({ onSubmit, submitLabel, isSubmitting, initialData }) => {
					const handleSubmit = (e: any) => {
						e.preventDefault();
						onSubmit({
							title: initialData?.title || "更新された本",
							type: initialData?.type || "book",
							url: initialData?.url || null,
							imageUrl: initialData?.imageUrl || null,
						});
					};
					return actualReact.createElement(
						"form",
						{ onSubmit: handleSubmit, "data-testid": "book-form" },
						actualReact.createElement(
							"button",
							{ type: "submit", disabled: isSubmitting },
							isSubmitting ? `${submitLabel}中...` : submitLabel,
						),
					);
				},
			),
		};
	});

	describe("EditBookModal", () => {
		const mockBook = {
			id: "1",
			title: "既存の本",
			type: BookType.BOOK,
			url: "https://example.com",
			imageUrl: "https://example.com/image.jpg",
			status: "unread" as const,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("isOpenがfalseの場合は何も表示されない", () => {
			const mockOnClose = vi.fn();
			const { container } = render(
				React.createElement(EditBookModal, {
					isOpen: false,
					onClose: mockOnClose,
					book: mockBook,
				}),
			);

			expect(container.firstChild).toBeNull();
		});

		it("isOpenがtrueの場合はモーダルが表示される", () => {
			const mockOnClose = vi.fn();
			render(
				React.createElement(EditBookModal, {
					isOpen: true,
					onClose: mockOnClose,
					book: mockBook,
				}),
			);

			expect(screen.getByRole("dialog")).toBeInTheDocument();
			expect(screen.getByText("本を編集")).toBeInTheDocument();
		});

		it("BookFormコンポーネントが正しいpropsで表示される", async () => {
			const mockOnClose = vi.fn();
			const { BookForm } = await import("./BookForm");

			render(
				React.createElement(EditBookModal, {
					isOpen: true,
					onClose: mockOnClose,
					book: mockBook,
				}),
			);

			expect(BookForm).toHaveBeenCalled();
			const lastCall = (BookForm as ReturnType<typeof vi.fn>).mock.calls[0];
			expect(lastCall[0]).toMatchObject({
				initialData: mockBook,
				submitLabel: "更新",
				isSubmitting: false,
			});
			expect(typeof lastCall[0].onSubmit).toBe("function");
		});

		it("キャンセルボタンクリックでonCloseが呼ばれる", () => {
			const mockOnClose = vi.fn();
			render(
				React.createElement(EditBookModal, {
					isOpen: true,
					onClose: mockOnClose,
					book: mockBook,
				}),
			);

			const cancelButton = screen.getByText("キャンセル");
			fireEvent.click(cancelButton);

			expect(mockOnClose).toHaveBeenCalled();
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
					isOpen: true,
					onClose: mockOnClose,
					book: mockBook,
				}),
			);

			const submitButton = screen.getByText("更新");
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(mockMutate).toHaveBeenCalledWith(
					expect.objectContaining({
						id: "1",
						title: "既存の本",
						type: BookType.BOOK,
					}),
					expect.any(Object),
				);
			});
		});

		it("更新中はボタンが無効化され、テキストが変わる", async () => {
			const mockOnClose = vi.fn();

			const { useUpdateBook } = await import("../queries/useUpdateBook");
			(useUpdateBook as ReturnType<typeof vi.fn>).mockReturnValue({
				mutate: vi.fn(),
				isPending: true,
			});

			render(
				React.createElement(EditBookModal, {
					isOpen: true,
					onClose: mockOnClose,
					book: mockBook,
				}),
			);

			const submitButton = screen.getByText("更新中...") as HTMLButtonElement;
			expect(submitButton).toBeDisabled();
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
					isOpen: true,
					onClose: mockOnClose,
					book: mockBook,
				}),
			);

			const submitButton = screen.getByText("更新");
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(mockOnClose).toHaveBeenCalled();
			});
		});
	});
}
