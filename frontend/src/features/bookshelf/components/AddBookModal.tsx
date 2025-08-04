/**
 * 本追加モーダルコンポーネント
 * 新しい本の情報を入力して追加するモーダル
 */

"use client";

import { useState } from "react";
import { useCreateBook } from "../queries/useCreateBook";
import type { CreateBookInput } from "../types";
import { BookType } from "../types";

interface AddBookModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function AddBookModal({ isOpen, onClose }: AddBookModalProps) {
	const createBook = useCreateBook();
	const [formData, setFormData] = useState<CreateBookInput>({
		title: "",
		type: BookType.BOOK,
		url: null,
		imageUrl: null,
	});

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		createBook.mutate(formData, {
			onSuccess: () => {
				onClose();
				// フォームをリセット
				setFormData({
					title: "",
					type: BookType.BOOK,
					url: null,
					imageUrl: null,
				});
			},
		});
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div
				className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
				role="dialog"
				aria-labelledby="modal-title"
			>
				<h2 id="modal-title" className="text-xl font-bold mb-4">
					本を追加
				</h2>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="title" className="block text-sm font-medium mb-1">
							タイトル *
						</label>
						<input
							type="text"
							id="title"
							name="title"
							value={formData.title}
							onChange={handleChange}
							required
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label htmlFor="type" className="block text-sm font-medium mb-1">
							タイプ *
						</label>
						<select
							id="type"
							name="type"
							value={formData.type}
							onChange={handleChange}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="book">書籍</option>
							<option value="pdf">PDF</option>
							<option value="github">GitHub</option>
							<option value="zenn">Zenn</option>
						</select>
					</div>

					<div>
						<label htmlFor="url" className="block text-sm font-medium mb-1">
							URL
						</label>
						<input
							type="url"
							id="url"
							name="url"
							value={formData.url || ""}
							onChange={handleChange}
							placeholder="https://example.com"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label
							htmlFor="imageUrl"
							className="block text-sm font-medium mb-1"
						>
							表紙画像URL
						</label>
						<input
							type="url"
							id="imageUrl"
							name="imageUrl"
							value={formData.imageUrl || ""}
							onChange={handleChange}
							placeholder="https://example.com/image.jpg"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div className="flex gap-3 justify-end pt-4">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
						>
							キャンセル
						</button>
						<button
							type="submit"
							disabled={createBook.isPending}
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{createBook.isPending ? "追加中..." : "追加"}
						</button>
					</div>
				</form>
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

	// useCreateBookのモック
	vi.mock("../queries/useCreateBook", () => ({
		useCreateBook: vi.fn(() => ({
			mutate: vi.fn(),
			isPending: false,
		})),
	}));

	describe("AddBookModal", () => {
		it("isOpenがfalseの場合は何も表示されない", () => {
			const mockOnClose = vi.fn();
			const { container } = render(
				React.createElement(AddBookModal, {
					isOpen: false,
					onClose: mockOnClose,
				}),
			);

			expect(container.firstChild).toBeNull();
		});

		it("isOpenがtrueの場合はモーダルが表示される", () => {
			const mockOnClose = vi.fn();
			render(
				React.createElement(AddBookModal, {
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			expect(screen.getByRole("dialog")).toBeInTheDocument();
			expect(screen.getByText("本を追加")).toBeInTheDocument();
		});

		it("すべてのフォームフィールドが表示される", () => {
			const mockOnClose = vi.fn();
			render(
				React.createElement(AddBookModal, {
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			expect(screen.getByLabelText("タイトル *")).toBeInTheDocument();
			expect(screen.getByLabelText("タイプ *")).toBeInTheDocument();
			expect(screen.getByLabelText("URL")).toBeInTheDocument();
			expect(screen.getByLabelText("表紙画像URL")).toBeInTheDocument();
		});

		it("タイプのセレクトボックスに正しいオプションがある", () => {
			const mockOnClose = vi.fn();
			render(
				React.createElement(AddBookModal, {
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			const typeSelect = screen.getByLabelText(
				"タイプ *",
			) as unknown as HTMLSelectElement;
			expect(typeSelect.options.length).toBe(4);
			expect(typeSelect.options[0].text).toBe("書籍");
			expect(typeSelect.options[1].text).toBe("PDF");
			expect(typeSelect.options[2].text).toBe("GitHub");
			expect(typeSelect.options[3].text).toBe("Zenn");
		});

		it("フォームの入力値が変更できる", () => {
			const mockOnClose = vi.fn();
			render(
				React.createElement(AddBookModal, {
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			const titleInput = screen.getByLabelText(
				"タイトル *",
			) as HTMLInputElement;
			const urlInput = screen.getByLabelText("URL") as HTMLInputElement;

			fireEvent.change(titleInput, { target: { value: "テスト書籍" } });
			fireEvent.change(urlInput, {
				target: { value: "https://example.com" },
			});

			expect(titleInput.value).toBe("テスト書籍");
			expect(urlInput.value).toBe("https://example.com");
		});

		it("キャンセルボタンクリックでonCloseが呼ばれる", () => {
			const mockOnClose = vi.fn();
			render(
				React.createElement(AddBookModal, {
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			const cancelButton = screen.getByText("キャンセル");
			fireEvent.click(cancelButton);

			expect(mockOnClose).toHaveBeenCalled();
		});

		it("フォーム送信時にcreateBook.mutateが呼ばれる", async () => {
			const mockMutate = vi.fn();
			const mockOnClose = vi.fn();

			const { useCreateBook } = await import("../queries/useCreateBook");
			(useCreateBook as ReturnType<typeof vi.fn>).mockReturnValue({
				mutate: mockMutate,
				isPending: false,
			});

			render(
				React.createElement(AddBookModal, {
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			const titleInput = screen.getByLabelText(
				"タイトル *",
			) as HTMLInputElement;
			const submitButton = screen.getByText("追加");

			fireEvent.change(titleInput, { target: { value: "新しい本" } });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(mockMutate).toHaveBeenCalledWith(
					expect.objectContaining({
						title: "新しい本",
						type: "book",
					}),
					expect.any(Object),
				);
			});
		});

		it("追加中はボタンが無効化され、テキストが変わる", async () => {
			const mockOnClose = vi.fn();

			const { useCreateBook } = await import("../queries/useCreateBook");
			(useCreateBook as ReturnType<typeof vi.fn>).mockReturnValue({
				mutate: vi.fn(),
				isPending: true,
			});

			render(
				React.createElement(AddBookModal, {
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			const submitButton = screen.getByText("追加中...") as HTMLButtonElement;
			expect(submitButton).toBeDisabled();
		});

		it("成功時にonCloseが呼ばれる", async () => {
			const mockOnClose = vi.fn();
			const mockMutate = vi.fn((_data, options) => {
				// onSuccessコールバックを呼び出す
				options.onSuccess();
			});

			const { useCreateBook } = await import("../queries/useCreateBook");
			(useCreateBook as ReturnType<typeof vi.fn>).mockReturnValue({
				mutate: mockMutate,
				isPending: false,
			});

			render(
				React.createElement(AddBookModal, {
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			const titleInput = screen.getByLabelText(
				"タイトル *",
			) as HTMLInputElement;
			const submitButton = screen.getByText("追加");

			fireEvent.change(titleInput, { target: { value: "新しい本" } });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(mockOnClose).toHaveBeenCalled();
			});
		});

		it("タイプを変更できる", () => {
			const mockOnClose = vi.fn();
			render(
				React.createElement(AddBookModal, {
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			const typeSelect = screen.getByLabelText(
				"タイプ *",
			) as unknown as HTMLSelectElement;
			fireEvent.change(typeSelect, { target: { value: "pdf" } });

			expect(typeSelect.value).toBe("pdf");
		});

		it("画像URLを入力できる", () => {
			const mockOnClose = vi.fn();
			render(
				React.createElement(AddBookModal, {
					isOpen: true,
					onClose: mockOnClose,
				}),
			);

			const imageUrlInput = screen.getByLabelText(
				"表紙画像URL",
			) as HTMLInputElement;
			fireEvent.change(imageUrlInput, {
				target: { value: "https://example.com/image.jpg" },
			});

			expect(imageUrlInput.value).toBe("https://example.com/image.jpg");
		});
	});
}
