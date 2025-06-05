/**
 * 評価フィルター・ソートコンポーネント
 */
"use client";

import { useState } from "react";
import type { RatingFilters as RatingFiltersType } from "../types";

interface Props {
	filters: RatingFiltersType;
	onChange: (filters: RatingFiltersType) => void;
}

export function RatingFilters({ filters, onChange }: Props) {
	const [isExpanded, setIsExpanded] = useState(false);

	const handleSortByChange = (sortBy: RatingFiltersType["sortBy"]) => {
		onChange({ ...filters, sortBy });
	};

	const handleOrderChange = (order: RatingFiltersType["order"]) => {
		onChange({ ...filters, order });
	};

	const handleScoreRangeChange = (type: "min" | "max", value: number) => {
		if (type === "min") {
			onChange({
				...filters,
				minScore: value,
				maxScore:
					filters.maxScore && value > filters.maxScore
						? value
						: filters.maxScore,
			});
		} else {
			onChange({
				...filters,
				maxScore: value,
				minScore:
					filters.minScore && value < filters.minScore
						? value
						: filters.minScore,
			});
		}
	};

	const handleCommentFilterChange = (hasComment?: boolean) => {
		onChange({ ...filters, hasComment });
	};

	const resetFilters = () => {
		onChange({
			sortBy: "createdAt",
			order: "desc",
			minScore: undefined,
			maxScore: undefined,
			hasComment: undefined,
		});
	};

	const hasActiveFilters = !!(
		filters.minScore ||
		filters.maxScore ||
		filters.hasComment !== undefined ||
		(filters.sortBy && filters.sortBy !== "createdAt") ||
		(filters.order && filters.order !== "desc")
	);

	return (
		<div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					<h3 className="font-medium text-gray-900">フィルター・ソート</h3>
					{hasActiveFilters && (
						<span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
							フィルター適用中
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					{hasActiveFilters && (
						<button
							type="button"
							onClick={resetFilters}
							className="text-sm text-gray-500 hover:text-gray-700"
						>
							リセット
						</button>
					)}
					<button
						type="button"
						onClick={() => setIsExpanded(!isExpanded)}
						className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
					>
						{isExpanded ? "簡易表示" : "詳細フィルター"}
						<svg
							className={`w-4 h-4 transition-transform ${
								isExpanded ? "rotate-180" : ""
							}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>
				</div>
			</div>

			{/* 基本フィルター（常時表示） */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
				{/* 最小スコアフィルター */}
				<div>
					<label
						htmlFor="minScore"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						最小スコア
					</label>
					<input
						id="minScore"
						type="number"
						min="1"
						max="10"
						step="0.1"
						value={filters.minScore || ""}
						onChange={(e) => {
							const value = e.target.value;
							onChange({
								...filters,
								minScore: value ? Number.parseFloat(value) : undefined,
							});
						}}
						className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="1.0"
						aria-label="最小スコア"
					/>
				</div>
				{/* ソート基準 */}
				<div>
					<span className="block text-sm font-medium text-gray-700 mb-2">
						並び順
					</span>
					<div className="flex gap-2">
						<select
							value={filters.sortBy || "createdAt"}
							onChange={(e) =>
								handleSortByChange(
									e.target.value as RatingFiltersType["sortBy"],
								)
							}
							className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							aria-label="ソート基準"
						>
							<option value="createdAt">評価日時</option>
							<option value="totalScore">総合スコア</option>
							<option value="practicalValue">実用性</option>
							<option value="technicalDepth">技術深度</option>
							<option value="understanding">理解度</option>
							<option value="novelty">新規性</option>
							<option value="importance">重要度</option>
						</select>
						<select
							value={filters.order || "desc"}
							onChange={(e) =>
								handleOrderChange(e.target.value as RatingFiltersType["order"])
							}
							className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							aria-label="並び順"
						>
							<option value="desc">降順</option>
							<option value="asc">昇順</option>
						</select>
					</div>
				</div>

				{/* コメント有無 */}
				<div>
					<span className="block text-sm font-medium text-gray-700 mb-2">
						コメント
					</span>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => handleCommentFilterChange(undefined)}
							className={`px-3 py-2 text-sm rounded-lg border ${
								filters.hasComment === undefined
									? "bg-blue-50 border-blue-200 text-blue-700"
									: "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
							}`}
						>
							すべて
						</button>
						<button
							type="button"
							onClick={() => handleCommentFilterChange(true)}
							className={`px-3 py-2 text-sm rounded-lg border ${
								filters.hasComment === true
									? "bg-blue-50 border-blue-200 text-blue-700"
									: "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
							}`}
						>
							あり
						</button>
						<button
							type="button"
							onClick={() => handleCommentFilterChange(false)}
							className={`px-3 py-2 text-sm rounded-lg border ${
								filters.hasComment === false
									? "bg-blue-50 border-blue-200 text-blue-700"
									: "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
							}`}
						>
							なし
						</button>
					</div>
				</div>

				{/* アクションボタン */}
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => {
							// フィルター適用は即座に実行されるため、効果なし
						}}
						className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
					>
						フィルター適用
					</button>
					<button
						type="button"
						onClick={() => {
							// ソート適用は即座に実行されるため、効果なし
						}}
						className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500"
					>
						ソート適用
					</button>
				</div>
			</div>

			{/* 詳細フィルター（展開時のみ） */}
			{isExpanded && (
				<div className="border-t pt-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* スコア範囲 */}
						<div>
							<span className="block text-sm font-medium text-gray-700 mb-2">
								スコア範囲
							</span>
							<div className="space-y-3">
								<div>
									<span className="block text-xs text-gray-500 mb-1">
										最小スコア: {filters.minScore || 1}
									</span>
									<input
										type="range"
										min="1"
										max="10"
										step="0.1"
										value={filters.minScore || 1}
										onChange={(e) =>
											handleScoreRangeChange(
												"min",
												Number.parseFloat(e.target.value),
											)
										}
										className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
										aria-label="最小スコア"
									/>
								</div>
								<div>
									<span className="block text-xs text-gray-500 mb-1">
										最大スコア: {filters.maxScore || 10}
									</span>
									<input
										type="range"
										min="1"
										max="10"
										step="0.1"
										value={filters.maxScore || 10}
										onChange={(e) =>
											handleScoreRangeChange(
												"max",
												Number.parseFloat(e.target.value),
											)
										}
										className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
										aria-label="最大スコア"
									/>
								</div>
								<div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
									範囲: {filters.minScore || 1} 〜 {filters.maxScore || 10}
								</div>
							</div>
						</div>

						{/* その他のフィルターオプション */}
						<div>
							<span className="block text-sm font-medium text-gray-700 mb-2">
								表示件数
							</span>
							<select
								value={filters.limit || 20}
								onChange={(e) =>
									onChange({
										...filters,
										limit: Number.parseInt(e.target.value),
									})
								}
								className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								aria-label="表示件数"
							>
								<option value={10}>10件</option>
								<option value={20}>20件</option>
								<option value={50}>50件</option>
								<option value={100}>100件</option>
							</select>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
