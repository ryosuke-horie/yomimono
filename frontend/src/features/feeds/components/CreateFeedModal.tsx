import { Modal } from "@/components/Modal";
import { type FormEvent, useState } from "react";
import { useCreateRSSFeed } from "../queries/useCreateRSSFeed";
import type { CreateRSSFeedDTO } from "../types";

interface CreateFeedModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CreateFeedModal({ isOpen, onClose }: CreateFeedModalProps) {
	const [formData, setFormData] = useState<CreateRSSFeedDTO>({
		name: "",
		url: "",
		updateInterval: 3600, // デフォルト: 1時間
		isActive: true,
	});

	const [errors, setErrors] = useState<Record<string, string>>({});
	const { mutate: createFeed, isLoading } = useCreateRSSFeed();

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = "フィード名を入力してください";
		}

		if (!formData.url.trim()) {
			newErrors.url = "URLを入力してください";
		} else {
			try {
				new URL(formData.url);
			} catch {
				newErrors.url = "有効なURLを入力してください";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		createFeed(formData, {
			onSuccess: () => {
				// フォームをリセット
				setFormData({
					name: "",
					url: "",
					updateInterval: 3600,
					isActive: true,
				});
				setErrors({});
				onClose();
			},
			onError: (error) => {
				setErrors({
					submit:
						error instanceof Error ? error.message : "エラーが発生しました",
				});
			},
		});
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="RSSフィード登録">
			<form onSubmit={handleSubmit} className="space-y-4">
				{/* フィード名 */}
				<div>
					<label
						htmlFor="name"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						フィード名
					</label>
					<input
						type="text"
						id="name"
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="例: Cloudflare Blog"
						required
					/>
					{errors.name && (
						<p className="mt-1 text-sm text-red-600">{errors.name}</p>
					)}
				</div>

				{/* URL */}
				<div>
					<label
						htmlFor="url"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						RSS URL
					</label>
					<input
						type="url"
						id="url"
						value={formData.url}
						onChange={(e) => setFormData({ ...formData, url: e.target.value })}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="https://example.com/rss.xml"
						required
					/>
					{errors.url && (
						<p className="mt-1 text-sm text-red-600">{errors.url}</p>
					)}
				</div>

				{/* 更新間隔 */}
				<div>
					<label
						htmlFor="updateInterval"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						更新間隔
					</label>
					<select
						id="updateInterval"
						value={formData.updateInterval}
						onChange={(e) =>
							setFormData({
								...formData,
								updateInterval: Number(e.target.value),
							})
						}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value={1800}>30分</option>
						<option value={3600}>1時間</option>
						<option value={7200}>2時間</option>
						<option value={21600}>6時間</option>
						<option value={43200}>12時間</option>
						<option value={86400}>24時間</option>
					</select>
				</div>

				{/* 有効/無効 */}
				<div className="flex items-center">
					<input
						type="checkbox"
						id="isActive"
						checked={formData.isActive}
						onChange={(e) =>
							setFormData({ ...formData, isActive: e.target.checked })
						}
						className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<label
						htmlFor="isActive"
						className="ml-2 block text-sm text-gray-700"
					>
						有効にする
					</label>
				</div>

				{/* エラーメッセージ */}
				{errors.submit && (
					<p className="text-sm text-red-600">{errors.submit}</p>
				)}

				{/* ボタン */}
				<div className="flex justify-end gap-3 pt-4">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
						disabled={isLoading}
					>
						キャンセル
					</button>
					<button
						type="submit"
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={isLoading}
					>
						{isLoading ? "登録中..." : "登録"}
					</button>
				</div>
			</form>
		</Modal>
	);
}
