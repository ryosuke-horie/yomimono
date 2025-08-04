/**
 * 本の入力フォームコンポーネント
 * 本の追加・編集で共通で使用するフォーム
 */

"use client";

import { useState } from "react";
import type { Book, CreateBookInput } from "../types";
import { BookType } from "../types";

interface BookFormProps {
	initialData?: Partial<Book>;
	onSubmit: (data: CreateBookInput) => void;
	submitLabel: string;
	isSubmitting?: boolean;
}

export function BookForm({
	initialData,
	onSubmit,
	submitLabel,
	isSubmitting = false,
}: BookFormProps) {
	const [formData, setFormData] = useState<CreateBookInput>({
		title: initialData?.title || "",
		type: initialData?.type || BookType.BOOK,
		url: initialData?.url || null,
		imageUrl: initialData?.imageUrl || null,
	});

	const [errors, setErrors] = useState<{
		title?: string;
		url?: string;
	}>({});

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]:
				value === "" && (name === "url" || name === "imageUrl") ? null : value,
		}));
		// エラーをクリア
		if (errors[name as keyof typeof errors]) {
			setErrors((prev) => ({ ...prev, [name]: undefined }));
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// バリデーション
		const newErrors: typeof errors = {};

		if (!formData.title.trim()) {
			newErrors.title = "タイトルは必須です";
		}

		// URLが必須の場合（GitHub、Zennタイプ）
		if (
			(formData.type === BookType.GITHUB || formData.type === BookType.ZENN) &&
			!formData.url
		) {
			newErrors.url = "URLは必須です";
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		onSubmit(formData);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label htmlFor="title" className="block text-sm font-medium mb-1">
					タイトル <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					id="title"
					name="title"
					value={formData.title}
					onChange={handleChange}
					className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
						errors.title ? "border-red-500" : "border-gray-300"
					}`}
					aria-invalid={!!errors.title}
					aria-describedby={errors.title ? "title-error" : undefined}
				/>
				{errors.title && (
					<p id="title-error" className="mt-1 text-sm text-red-500">
						{errors.title}
					</p>
				)}
			</div>

			<div>
				<label htmlFor="type" className="block text-sm font-medium mb-1">
					タイプ <span className="text-red-500">*</span>
				</label>
				<select
					id="type"
					name="type"
					value={formData.type}
					onChange={handleChange}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value={BookType.BOOK}>書籍</option>
					<option value={BookType.PDF}>PDF</option>
					<option value={BookType.GITHUB}>GitHub</option>
					<option value={BookType.ZENN}>Zenn</option>
				</select>
			</div>

			<div>
				<label htmlFor="url" className="block text-sm font-medium mb-1">
					URL
					{(formData.type === BookType.GITHUB ||
						formData.type === BookType.ZENN) && (
						<span className="text-red-500"> *</span>
					)}
				</label>
				<input
					type="url"
					id="url"
					name="url"
					value={formData.url || ""}
					onChange={handleChange}
					placeholder="https://example.com"
					className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
						errors.url ? "border-red-500" : "border-gray-300"
					}`}
					aria-invalid={!!errors.url}
					aria-describedby={errors.url ? "url-error" : undefined}
				/>
				{errors.url && (
					<p id="url-error" className="mt-1 text-sm text-red-500">
						{errors.url}
					</p>
				)}
			</div>

			<div>
				<label htmlFor="imageUrl" className="block text-sm font-medium mb-1">
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

			<div className="flex justify-end">
				<button
					type="submit"
					disabled={isSubmitting}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{isSubmitting ? `${submitLabel}中...` : submitLabel}
				</button>
			</div>
		</form>
	);
}

if (import.meta.vitest) {
	const { describe, it, expect, vi } = import.meta.vitest;
	const { render, screen, fireEvent, waitFor } = await import(
		"@testing-library/react"
	);
	const React = await import("react");

	describe("BookForm", () => {
		it("初期値が正しく表示される", () => {
			const mockOnSubmit = vi.fn();
			const initialData = {
				title: "既存の本",
				type: BookType.PDF,
				url: "https://example.com",
				imageUrl: "https://example.com/image.jpg",
			};

			render(
				React.createElement(BookForm, {
					initialData,
					onSubmit: mockOnSubmit,
					submitLabel: "更新",
				}),
			);

			expect(
				(screen.getByLabelText(/タイトル/) as HTMLInputElement).value,
			).toBe("既存の本");
			expect((screen.getByLabelText(/タイプ/) as HTMLSelectElement).value).toBe(
				BookType.PDF,
			);
			expect((screen.getByLabelText(/^URL/) as HTMLInputElement).value).toBe(
				"https://example.com",
			);
			expect(
				(screen.getByLabelText(/表紙画像URL/) as HTMLInputElement).value,
			).toBe("https://example.com/image.jpg");
		});

		it("タイトルが空の場合にエラーメッセージが表示される", async () => {
			const mockOnSubmit = vi.fn();

			render(
				React.createElement(BookForm, {
					onSubmit: mockOnSubmit,
					submitLabel: "追加",
				}),
			);

			const submitButton = screen.getByText("追加");
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText("タイトルは必須です")).toBeInTheDocument();
			});
			expect(mockOnSubmit).not.toHaveBeenCalled();
		});

		it("GitHubタイプの場合、URLが必須になる", async () => {
			const mockOnSubmit = vi.fn();

			render(
				React.createElement(BookForm, {
					onSubmit: mockOnSubmit,
					submitLabel: "追加",
				}),
			);

			const titleInput = screen.getByLabelText(/タイトル/);
			const typeSelect = screen.getByLabelText(/タイプ/);
			const submitButton = screen.getByText("追加");

			fireEvent.change(titleInput, { target: { value: "テスト" } });
			fireEvent.change(typeSelect, { target: { value: BookType.GITHUB } });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText("URLは必須です")).toBeInTheDocument();
			});
			expect(mockOnSubmit).not.toHaveBeenCalled();
		});

		it("Zennタイプの場合、URLが必須になる", async () => {
			const mockOnSubmit = vi.fn();

			render(
				React.createElement(BookForm, {
					onSubmit: mockOnSubmit,
					submitLabel: "追加",
				}),
			);

			const titleInput = screen.getByLabelText(/タイトル/);
			const typeSelect = screen.getByLabelText(/タイプ/);
			const submitButton = screen.getByText("追加");

			fireEvent.change(titleInput, { target: { value: "テスト" } });
			fireEvent.change(typeSelect, { target: { value: BookType.ZENN } });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText("URLは必須です")).toBeInTheDocument();
			});
			expect(mockOnSubmit).not.toHaveBeenCalled();
		});

		it("有効なデータで送信できる", async () => {
			const mockOnSubmit = vi.fn();

			render(
				React.createElement(BookForm, {
					onSubmit: mockOnSubmit,
					submitLabel: "追加",
				}),
			);

			const titleInput = screen.getByLabelText(/タイトル/);
			const urlInput = screen.getByLabelText(/^URL/);
			const submitButton = screen.getByText("追加");

			fireEvent.change(titleInput, { target: { value: "新しい本" } });
			fireEvent.change(urlInput, { target: { value: "https://example.com" } });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith({
					title: "新しい本",
					type: BookType.BOOK,
					url: "https://example.com",
					imageUrl: null,
				});
			});
		});

		it("送信中はボタンが無効化される", () => {
			const mockOnSubmit = vi.fn();

			render(
				React.createElement(BookForm, {
					onSubmit: mockOnSubmit,
					submitLabel: "追加",
					isSubmitting: true,
				}),
			);

			const submitButton = screen.getByText("追加中...") as HTMLButtonElement;
			expect(submitButton).toBeDisabled();
		});

		it("エラー後に入力するとエラーがクリアされる", async () => {
			const mockOnSubmit = vi.fn();

			render(
				React.createElement(BookForm, {
					onSubmit: mockOnSubmit,
					submitLabel: "追加",
				}),
			);

			const submitButton = screen.getByText("追加");
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText("タイトルは必須です")).toBeInTheDocument();
			});

			const titleInput = screen.getByLabelText(/タイトル/);
			fireEvent.change(titleInput, { target: { value: "テスト" } });

			await waitFor(() => {
				expect(
					screen.queryByText("タイトルは必須です"),
				).not.toBeInTheDocument();
			});
		});
	});
}
