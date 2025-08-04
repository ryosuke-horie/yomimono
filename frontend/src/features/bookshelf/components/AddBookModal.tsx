/**
 * 本追加モーダルコンポーネント
 * 新しい本の情報を入力して追加するモーダル
 */

"use client";

import { useState } from "react";
import { useBookshelf } from "../hooks/useBookshelf";
import type { CreateBookRequest } from "../types";

interface AddBookModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function AddBookModal({ isOpen, onClose }: AddBookModalProps) {
	const { addBook } = useBookshelf();
	const [formData, setFormData] = useState<CreateBookRequest>({
		title: "",
		author: "",
		coverUrl: "",
		status: "unread",
		type: "book",
		notes: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			await addBook(formData);
			onClose();
		} catch (error) {
			console.error("本の追加に失敗しました:", error);
		} finally {
			setIsSubmitting(false);
		}
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
						<label htmlFor="author" className="block text-sm font-medium mb-1">
							著者
						</label>
						<input
							type="text"
							id="author"
							name="author"
							value={formData.author}
							onChange={handleChange}
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
							<option value="repository">リポジトリ</option>
						</select>
					</div>

					<div>
						<label htmlFor="status" className="block text-sm font-medium mb-1">
							ステータス *
						</label>
						<select
							id="status"
							name="status"
							value={formData.status}
							onChange={handleChange}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="unread">未読</option>
							<option value="reading">読書中</option>
							<option value="completed">読了</option>
						</select>
					</div>

					<div>
						<label
							htmlFor="coverUrl"
							className="block text-sm font-medium mb-1"
						>
							表紙画像URL
						</label>
						<input
							type="url"
							id="coverUrl"
							name="coverUrl"
							value={formData.coverUrl}
							onChange={handleChange}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label htmlFor="notes" className="block text-sm font-medium mb-1">
							メモ
						</label>
						<textarea
							id="notes"
							name="notes"
							value={formData.notes}
							onChange={handleChange}
							rows={3}
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
							disabled={isSubmitting}
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isSubmitting ? "追加中..." : "追加"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
