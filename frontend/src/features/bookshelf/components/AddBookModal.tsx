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
