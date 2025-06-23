/**
 * 未使用ラベルクリーンアップ機能コンポーネント
 * 使用されていないラベルの一括削除を行う
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Label } from "../types";

interface LabelCleanupProps {
	labels: Label[];
	onCleanup: () => void;
	isLoading?: boolean;
	error?: Error | null;
}

export function LabelCleanup({
	labels,
	onCleanup,
	isLoading = false,
	error,
}: LabelCleanupProps) {
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);

	// 未使用ラベル（記事数が0のラベル）をフィルタリング
	const unusedLabels = labels.filter(
		(label) => (label.articleCount ?? 0) === 0,
	);

	const openConfirm = () => setIsConfirmOpen(true);
	const closeConfirm = () => setIsConfirmOpen(false);

	const handleConfirm = () => {
		onCleanup();
		closeConfirm();
	};

	// 未使用ラベルがない場合は何も表示しない
	if (unusedLabels.length === 0) {
		return null;
	}

	return (
		<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<h3 className="text-lg font-medium text-yellow-800 mb-2">
						未使用ラベルのクリーンアップ
					</h3>
					<p className="text-sm text-yellow-700 mb-3">
						{unusedLabels.length}
						個の未使用ラベルが見つかりました。これらのラベルは記事に関連付けられていないため、削除することができます。
					</p>

					{/* 未使用ラベルの一覧表示 */}
					<div className="mb-4">
						<details className="text-sm">
							<summary className="cursor-pointer text-yellow-700 hover:text-yellow-800 font-medium">
								未使用ラベル一覧を表示 ({unusedLabels.length}個)
							</summary>
							<div className="mt-2 pl-4">
								<ul className="space-y-1">
									{unusedLabels.map((label) => (
										<li key={label.id} className="text-yellow-600">
											• {label.name}
											{label.description && (
												<span className="text-xs text-yellow-500 ml-2">
													({label.description.substring(0, 50)}
													{label.description.length > 50 ? "..." : ""})
												</span>
											)}
										</li>
									))}
								</ul>
							</div>
						</details>
					</div>

					{/* エラー表示 */}
					{error && (
						<div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
							{error.message}
						</div>
					)}
				</div>

				<div className="ml-4">
					<Button
						type="button"
						onClick={openConfirm}
						variant="danger"
						size="sm"
						disabled={isLoading}
						className="whitespace-nowrap"
					>
						{isLoading ? "削除中..." : "未使用ラベルを削除"}
					</Button>
				</div>
			</div>

			{/* 確認ダイアログ */}
			<ConfirmDialog
				isOpen={isConfirmOpen}
				onClose={closeConfirm}
				onConfirm={handleConfirm}
				title="未使用ラベルの一括削除"
				message={`${unusedLabels.length}個の未使用ラベルを削除してもよろしいですか？この操作は取り消すことができません。`}
				confirmText="削除する"
				cancelText="キャンセル"
				isLoading={isLoading}
			/>
		</div>
	);
}
