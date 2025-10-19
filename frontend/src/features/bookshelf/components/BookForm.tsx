/**
 * 本棚への本の追加・編集フォームコンポーネント
 * 書籍、PDF、GitHub、Zennなどのコンテンツを管理
 */
"use client";

import { useEffect, useId, useState } from "react";
import type {
	Book,
	BookTypeValue,
	CreateBookInput,
	UpdateBookInput,
} from "../types";

interface BookFormProps {
	book?: Book; // 編集時は既存のBookデータを渡す
	onSubmit: (data: CreateBookInput | UpdateBookInput) => void;
	onCancel: () => void;
	isSubmitting?: boolean;
}

export function BookForm({
	book,
	onSubmit,
	onCancel,
	isSubmitting = false,
}: BookFormProps) {
	const isEditMode = !!book;

	// フォームの状態管理
	const [formData, setFormData] = useState<{
		type: BookTypeValue;
		title: string;
		url: string;
		imageUrl: string;
	}>({
		type: book?.type || "book",
		title: book?.title || "",
		url: book?.url || "",
		imageUrl: book?.imageUrl || "",
	});

	// バリデーションエラー
	const [errors, setErrors] = useState<{
		title?: string;
		url?: string;
	}>({});
	const formId = useId();
	const typeFieldId = `${formId}-type`;
	const titleFieldId = `${formId}-title`;
	const urlFieldId = `${formId}-url`;
	const imageUrlFieldId = `${formId}-image-url`;

	// 編集モード時、bookが変更されたらフォームを更新
	useEffect(() => {
		if (book) {
			setFormData({
				type: book.type,
				title: book.title,
				url: book.url || "",
				imageUrl: book.imageUrl || "",
			});
		}
	}, [book]);

	// タイプに応じてURLが必須かどうかを判定
	const isUrlRequired = formData.type !== "book";

	// バリデーション
	const validate = (): boolean => {
		const newErrors: typeof errors = {};

		// タイトルのバリデーション
		if (!formData.title.trim()) {
			newErrors.title = "タイトルは必須です";
		} else if (formData.title.length > 255) {
			newErrors.title = "タイトルは255文字以内で入力してください";
		}

		// URLのバリデーション（PDF/GitHub/Zennの場合は必須）
		if (isUrlRequired && !formData.url.trim()) {
			newErrors.url = "URLは必須です";
		} else if (formData.url && !isValidUrl(formData.url)) {
			newErrors.url = "有効なURLを入力してください";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// URL形式のバリデーション
	const isValidUrl = (url: string): boolean => {
		try {
			const urlObj = new URL(url);
			return urlObj.protocol === "http:" || urlObj.protocol === "https:";
		} catch {
			return false;
		}
	};

	// フォーム送信処理
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!validate()) {
			return;
		}

		const submitData: CreateBookInput | UpdateBookInput = isEditMode
			? {
					// 編集時は変更があったフィールドのみ送信
					...(formData.type !== book.type && { type: formData.type }),
					...(formData.title !== book.title && { title: formData.title }),
					...(formData.url !== (book.url || "") && {
						url: formData.url || undefined,
					}),
					...(formData.imageUrl !== (book.imageUrl || "") && {
						imageUrl: formData.imageUrl || undefined,
					}),
				}
			: {
					// 新規作成時はすべてのフィールドを送信
					type: formData.type,
					title: formData.title,
					url: formData.url || undefined,
					imageUrl: formData.imageUrl || undefined,
				};

		onSubmit(submitData);
	};

	// フィールド変更ハンドラー
	const handleChange = (
		field: keyof typeof formData,
		value: string | BookTypeValue,
	) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));

		// エラーをクリア
		if (field === "title" || field === "url") {
			setErrors((prev) => ({
				...prev,
				[field]: undefined,
			}));
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{/* タイプ選択 */}
			<div>
				<label
					htmlFor={typeFieldId}
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					タイプ <span className="text-red-500">*</span>
				</label>
				<select
					id={typeFieldId}
					value={formData.type}
					onChange={(e) =>
						handleChange("type", e.target.value as BookTypeValue)
					}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					disabled={isSubmitting}
				>
					<option value="book">書籍</option>
					<option value="pdf">PDF</option>
					<option value="github">GitHub</option>
					<option value="zenn">Zenn</option>
				</select>
			</div>

			{/* タイトル入力 */}
			<div>
				<label
					htmlFor={titleFieldId}
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					タイトル <span className="text-red-500">*</span>
				</label>
				<input
					id={titleFieldId}
					type="text"
					value={formData.title}
					onChange={(e) => handleChange("title", e.target.value)}
					className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
						errors.title ? "border-red-500" : "border-gray-300"
					}`}
					placeholder="タイトルを入力"
					maxLength={255}
					disabled={isSubmitting}
				/>
				{errors.title && (
					<p className="mt-1 text-sm text-red-500">{errors.title}</p>
				)}
			</div>

			{/* URL入力 */}
			<div>
				<label
					htmlFor={urlFieldId}
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					URL {isUrlRequired && <span className="text-red-500">*</span>}
				</label>
				<input
					id={urlFieldId}
					type="url"
					value={formData.url}
					onChange={(e) => handleChange("url", e.target.value)}
					className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
						errors.url ? "border-red-500" : "border-gray-300"
					}`}
					placeholder={
						isUrlRequired ? "URLを入力（必須）" : "URLを入力（任意）"
					}
					disabled={isSubmitting}
				/>
				{errors.url && (
					<p className="mt-1 text-sm text-red-500">{errors.url}</p>
				)}
			</div>

			{/* 画像URL入力 */}
			<div>
				<label
					htmlFor={imageUrlFieldId}
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					画像URL
				</label>
				<input
					id={imageUrlFieldId}
					type="url"
					value={formData.imageUrl}
					onChange={(e) => handleChange("imageUrl", e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="書籍の表紙画像URLを入力（任意）"
					disabled={isSubmitting}
				/>
				<p className="mt-1 text-xs text-gray-500">
					将来的にGoogle Books APIで自動取得予定
				</p>
			</div>

			{/* ボタン */}
			<div className="flex justify-end space-x-3">
				<button
					type="button"
					onClick={onCancel}
					className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
					disabled={isSubmitting}
				>
					キャンセル
				</button>
				<button
					type="submit"
					className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={isSubmitting}
				>
					{isSubmitting ? "送信中..." : isEditMode ? "更新" : "追加"}
				</button>
			</div>
		</form>
	);
}

// Vitestテスト
if (import.meta.vitest) {
	const { test, expect, describe, vi } = import.meta.vitest;
	const { render, fireEvent, screen } = await import("@testing-library/react");
	const React = await import("react");

	describe("BookForm", () => {
		test("新規作成モードで初期値が正しく設定される", () => {
			const onSubmit = vi.fn();
			const onCancel = vi.fn();
			render(React.createElement(BookForm, { onSubmit, onCancel }));

			const typeSelect = screen.getByLabelText(
				/^タイプ/,
			) as unknown as HTMLSelectElement;
			const titleInput = screen.getByLabelText(
				/^タイトル/,
			) as unknown as HTMLInputElement;
			const urlInput = screen.getByLabelText(
				/^URL/,
			) as unknown as HTMLInputElement;
			const imageUrlInput = screen.getByLabelText(
				/^画像URL/,
			) as unknown as HTMLInputElement;

			expect(typeSelect).toHaveValue("book");
			expect(titleInput).toHaveValue("");
			expect(urlInput).toHaveValue("");
			expect(imageUrlInput).toHaveValue("");
		});

		test("編集モードで既存データが正しく表示される", () => {
			const mockBook: Book = {
				id: 1,
				type: "pdf",
				title: "テストPDF",
				url: "https://example.com/test.pdf",
				imageUrl: "https://example.com/image.jpg",
				status: "unread",
				progress: 0,
				completedAt: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			const onSubmit = vi.fn();
			const onCancel = vi.fn();
			render(
				React.createElement(BookForm, { book: mockBook, onSubmit, onCancel }),
			);

			const typeSelect = screen.getByLabelText(
				/^タイプ/,
			) as unknown as HTMLSelectElement;
			const titleInput = screen.getByLabelText(
				/^タイトル/,
			) as unknown as HTMLInputElement;
			const urlInput = screen.getByLabelText(
				/^URL/,
			) as unknown as HTMLInputElement;
			const imageUrlInput = screen.getByLabelText(
				/^画像URL/,
			) as unknown as HTMLInputElement;

			expect(typeSelect).toHaveValue("pdf");
			expect(titleInput).toHaveValue("テストPDF");
			expect(urlInput).toHaveValue("https://example.com/test.pdf");
			expect(imageUrlInput).toHaveValue("https://example.com/image.jpg");
		});

		test("タイトルが空の場合バリデーションエラーが表示される", () => {
			const onSubmit = vi.fn();
			const onCancel = vi.fn();
			const { container } = render(
				React.createElement(BookForm, { onSubmit, onCancel }),
			);

			const form = container.querySelector("form") as HTMLFormElement;
			fireEvent.submit(form);

			// バリデーションエラーは同期的に表示される
			// p.text-red-500でエラーメッセージを取得（ラベルの*ではなく）
			const errorMessage = container.querySelector("p.text-red-500");
			expect(errorMessage?.textContent).toBe("タイトルは必須です");
			expect(onSubmit).not.toHaveBeenCalled();
		});

		test("PDF/GitHub/Zennの場合URLが必須になる", () => {
			const onSubmit = vi.fn();
			const onCancel = vi.fn();
			const { container } = render(
				React.createElement(BookForm, { onSubmit, onCancel }),
			);

			const typeSelect = screen.getByLabelText(
				/^タイプ/,
			) as unknown as HTMLSelectElement;
			const titleInput = screen.getByLabelText(
				/^タイトル/,
			) as unknown as HTMLInputElement;
			const form = container.querySelector("form") as HTMLFormElement;

			// PDFタイプを選択
			fireEvent.change(typeSelect, { target: { value: "pdf" } });
			fireEvent.change(titleInput, { target: { value: "テストPDF" } });
			fireEvent.submit(form);

			// バリデーションエラーは同期的に表示される
			// p.text-red-500でエラーメッセージを取得（ラベルの*ではなく）
			const errorMessage = container.querySelector("p.text-red-500");
			expect(errorMessage?.textContent).toBe("URLは必須です");
			expect(onSubmit).not.toHaveBeenCalled();
		});

		test("正しいデータで送信される", () => {
			const onSubmit = vi.fn();
			const onCancel = vi.fn();
			const { container } = render(
				React.createElement(BookForm, { onSubmit, onCancel }),
			);

			const titleInput = screen.getByLabelText(
				/^タイトル/,
			) as unknown as HTMLInputElement;
			const form = container.querySelector("form") as HTMLFormElement;

			fireEvent.change(titleInput, { target: { value: "テスト書籍" } });
			fireEvent.submit(form);

			expect(onSubmit).toHaveBeenCalledWith({
				type: "book",
				title: "テスト書籍",
				url: undefined,
				imageUrl: undefined,
			});
		});

			test("HTTPとHTTPSプロトコルのURLは有効と判定される", () => {
				const onSubmit = vi.fn();
				const onCancel = vi.fn();
				const { container } = render(
					React.createElement(BookForm, { onSubmit, onCancel }),
				);

				const typeSelect = screen.getByLabelText(
					/^タイプ/,
				) as unknown as HTMLSelectElement;
				const titleInput = screen.getByLabelText(
					/^タイトル/,
				) as unknown as HTMLInputElement;
				const urlInput = screen.getByLabelText(
					/^URL/,
				) as unknown as HTMLInputElement;
				const form = container.querySelector("form") as HTMLFormElement;

			// PDFタイプを選択（URLが必須）
			fireEvent.change(typeSelect, { target: { value: "pdf" } });
			fireEvent.change(titleInput, { target: { value: "テストPDF" } });

			// HTTPSのURLをテスト
			fireEvent.change(urlInput, {
				target: { value: "https://example.com/test.pdf" },
			});
			fireEvent.submit(form);

			expect(onSubmit).toHaveBeenCalledWith({
				type: "pdf",
				title: "テストPDF",
				url: "https://example.com/test.pdf",
				imageUrl: undefined,
			});

			// HTTPのURLをテスト
			onSubmit.mockClear();
			fireEvent.change(urlInput, {
				target: { value: "http://example.com/test.pdf" },
			});
			fireEvent.submit(form);

			expect(onSubmit).toHaveBeenCalledWith({
				type: "pdf",
				title: "テストPDF",
				url: "http://example.com/test.pdf",
				imageUrl: undefined,
			});
		});

			test("HTTP/HTTPS以外のプロトコルは無効と判定される", () => {
				const onSubmit = vi.fn();
				const onCancel = vi.fn();
				const { container } = render(
					React.createElement(BookForm, { onSubmit, onCancel }),
				);

				const typeSelect = screen.getByLabelText(
					/^タイプ/,
				) as unknown as HTMLSelectElement;
				const titleInput = screen.getByLabelText(
					/^タイトル/,
				) as unknown as HTMLInputElement;
				const urlInput = screen.getByLabelText(
					/^URL/,
				) as unknown as HTMLInputElement;
				const form = container.querySelector("form") as HTMLFormElement;

			// PDFタイプを選択（URLが必須）
			fireEvent.change(typeSelect, { target: { value: "pdf" } });
			fireEvent.change(titleInput, { target: { value: "テストPDF" } });

			// file://プロトコルをテスト
			fireEvent.change(urlInput, {
				target: { value: "file:///etc/passwd" },
			});
			fireEvent.submit(form);

			let errorMessage = container.querySelector("p.text-red-500");
			expect(errorMessage?.textContent).toBe("有効なURLを入力してください");
			expect(onSubmit).not.toHaveBeenCalled();

			// javascript:プロトコルをテスト
			fireEvent.change(urlInput, {
				target: { value: "javascript:alert('XSS')" },
			});
			fireEvent.submit(form);

			errorMessage = container.querySelector("p.text-red-500");
			expect(errorMessage?.textContent).toBe("有効なURLを入力してください");
			expect(onSubmit).not.toHaveBeenCalled();

			// ftp://プロトコルをテスト
			fireEvent.change(urlInput, {
				target: { value: "ftp://example.com/file.pdf" },
			});
			fireEvent.submit(form);

			errorMessage = container.querySelector("p.text-red-500");
			expect(errorMessage?.textContent).toBe("有効なURLを入力してください");
			expect(onSubmit).not.toHaveBeenCalled();
		});
	});
}
