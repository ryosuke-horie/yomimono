"use client";

import { useEffect, useId, useState } from "react";
import type { Label } from "../types";

interface Props {
	label: Label;
	onSubmit: (id: number, description: string | null) => void;
	onCancel: () => void;
	isSubmitting?: boolean;
	error?: Error | null;
}

export function LabelEditForm({
	label,
	onSubmit,
	onCancel,
	isSubmitting = false,
	error = null,
}: Props) {
	const [description, setDescription] = useState(label.description || "");
	const descriptionFieldId = useId();

	// labelが変更された場合にフォームをリセット
	useEffect(() => {
		setDescription(label.description || "");
	}, [label]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(label.id, description.trim() || null);
	};

	return (
		<div className="bg-white rounded-lg shadow p-6 mb-6">
			<h2 className="text-lg font-medium mb-4">ラベル説明文の編集</h2>
			<div className="mb-4">
				<div className="text-sm font-medium text-gray-700 mb-1">ラベル名</div>
				<div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
					{label.name}
				</div>
				<p className="mt-1 text-xs text-gray-500">
					ラベル名は編集できません。新しいラベルを作成してください。
				</p>
			</div>

			<form onSubmit={handleSubmit}>
				<div className="mb-6">
					<label
						htmlFor={descriptionFieldId}
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						説明文
					</label>
					<textarea
						id={descriptionFieldId}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						rows={4}
						placeholder="このラベルの説明（MCPの自動ラベリングの参考になります）"
						disabled={isSubmitting}
					/>
					<p className="mt-1 text-xs text-gray-500">
						このラベルがどのような記事に適用されるべきかを説明してください。これはMCPが自動ラベリングを行う際の判断基準になります。空にすると説明文がない状態になります。
					</p>
				</div>

				{/* エラーメッセージ */}
				{error && (
					<div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
						{error.message}
					</div>
				)}

				<div className="flex justify-end space-x-3">
					<button
						type="button"
						onClick={onCancel}
						className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={isSubmitting}
					>
						キャンセル
					</button>
					<button
						type="submit"
						className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={isSubmitting}
					>
						{isSubmitting ? "保存中..." : "保存"}
					</button>
				</div>
			</form>
		</div>
	);
}
