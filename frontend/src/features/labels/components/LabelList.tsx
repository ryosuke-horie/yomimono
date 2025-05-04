"use client";

import { useState } from "react";
import type { Label } from "../types";

interface Props {
	labels: Label[];
	onEdit: (labelId: number) => void;
	onDelete: (labelId: number) => void;
}

export function LabelList({ labels, onEdit, onDelete }: Props) {
	const [expandedLabelId, setExpandedLabelId] = useState<number | null>(null);

	// 説明を展開/折りたたむ関数
	const toggleDescription = (labelId: number) => {
		if (expandedLabelId === labelId) {
			setExpandedLabelId(null);
		} else {
			setExpandedLabelId(labelId);
		}
	};

	if (labels.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500">
				ラベルがまだ登録されていません。
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow overflow-hidden">
			<ul className="divide-y divide-gray-200">
				{labels.map((label) => (
					<li key={label.id} className="p-4 hover:bg-gray-50">
						<div className="flex justify-between items-start">
							<div className="flex-1">
								<div className="flex items-center space-x-2 mb-1">
									<span className="font-medium text-gray-900">
										{label.name}
									</span>
									<span className="text-sm text-gray-500">
										({label.articleCount ?? 0}記事)
									</span>
								</div>

								{/* 説明文があれば表示（折りたたみ可能） */}
								{label.description && (
									<div className="mt-1">
										<button
											type="button"
											onClick={() => toggleDescription(label.id)}
											className="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none"
										>
											{expandedLabelId === label.id
												? "説明を隠す"
												: "説明を表示"}
										</button>
										{expandedLabelId === label.id && (
											<p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
												{label.description}
											</p>
										)}
									</div>
								)}

								{/* 作成日・更新日 */}
								<div className="mt-2 text-xs text-gray-500">
									{label.createdAt && (
										<span>
											作成: {new Date(label.createdAt).toLocaleString()}
											{label.updatedAt &&
												label.updatedAt !== label.createdAt && (
													<span>
														{" "}
														• 更新: {new Date(label.updatedAt).toLocaleString()}
													</span>
												)}
										</span>
									)}
								</div>
							</div>

							{/* 操作ボタン */}
							<div className="flex space-x-2">
								<button
									type="button"
									onClick={() => onEdit(label.id)}
									className="text-sm px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									編集
								</button>
								<button
									type="button"
									onClick={() => onDelete(label.id)}
									className="text-sm px-3 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
								>
									削除
								</button>
							</div>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}
