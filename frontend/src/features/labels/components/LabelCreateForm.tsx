"use client";

import { useState } from "react";

interface Props {
	onSubmit: (name: string, description: string) => void;
	onCancel: () => void;
	isSubmitting?: boolean;
	error?: Error | null;
}

export function LabelCreateForm({
	onSubmit,
	onCancel,
	isSubmitting = false,
	error = null,
}: Props) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [nameError, setNameError] = useState<string | null>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// バリデーション
		if (!name.trim()) {
			setNameError("ラベル名を入力してください");
			return;
		}

		onSubmit(name.trim(), description.trim());
	};

	return (
		<div className="bg-white rounded-lg shadow p-6 mb-6">
			<h2 className="text-lg font-medium mb-4">新しいラベルを作成</h2>

			<form onSubmit={handleSubmit}>
				<div className="mb-4">
					<label
						htmlFor="label-name"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						ラベル名 <span className="text-red-500">*</span>
					</label>
					<input
						type="text"
						id="label-name"
						value={name}
						onChange={(e) => {
							setName(e.target.value);
							setNameError(null); // エラーをクリア
						}}
						className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
							nameError ? "border-red-500" : "border-gray-300"
						}`}
						placeholder="例：react, typescript, aws"
						disabled={isSubmitting}
						required
					/>
					{nameError && (
						<p className="mt-1 text-sm text-red-600">{nameError}</p>
					)}
					<p className="mt-1 text-xs text-gray-500">
						ラベル名は自動的に正規化されます（小文字化、前後の空白除去等）
					</p>
				</div>

				<div className="mb-6">
					<label
						htmlFor="label-description"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						説明文
					</label>
					<textarea
						id="label-description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						rows={4}
						placeholder="このラベルの説明（MCPの自動ラベリングの参考になります）"
						disabled={isSubmitting}
					/>
					<p className="mt-1 text-xs text-gray-500">
						このラベルがどのような記事に適用されるべきかを説明してください。これはMCPが自動ラベリングを行う際の判断基準になります。
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
						{isSubmitting ? "作成中..." : "作成"}
					</button>
				</div>
			</form>
		</div>
	);
}
