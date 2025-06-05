/**
 * 評価統計サマリーコンポーネント
 */
"use client";

import type { RatingStats } from "../types";

interface Props {
	stats?: RatingStats;
	isLoading?: boolean;
}

export function RatingStatsSummary({ stats, isLoading = false }: Props) {
	if (isLoading) {
		return (
			<div className="bg-white rounded-lg shadow-sm border p-6">
				<div className="text-center py-4 mb-4">
					<div className="text-lg text-gray-600 mb-2">読み込み中...</div>
					<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
				</div>
				<div className="animate-pulse">
					<div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={`skeleton-${i}`} className="space-y-2">
								<div className="h-4 bg-gray-200 rounded w-2/3" />
								<div className="h-8 bg-gray-200 rounded w-1/2" />
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (!stats) {
		return (
			<div className="bg-white rounded-lg shadow-sm border p-6">
				<p className="text-gray-500 text-center">
					統計情報を読み込めませんでした
				</p>
			</div>
		);
	}

	const statCards = [
		{
			title: "総評価数",
			value: stats.totalCount.toLocaleString(),
			icon: "📊",
			color: "text-blue-600",
			bgColor: "bg-blue-50",
		},
		{
			title: "平均スコア",
			value: stats.averageScore.toFixed(1),
			unit: "/10",
			icon: "⭐",
			color: "text-yellow-600",
			bgColor: "bg-yellow-50",
		},
		{
			title: "コメント付き",
			value: stats.ratingsWithComments.toLocaleString(),
			percentage:
				stats.totalCount > 0
					? `(${((stats.ratingsWithComments / stats.totalCount) * 100).toFixed(1)}%)`
					: "",
			icon: "💬",
			color: "text-green-600",
			bgColor: "bg-green-50",
		},
		{
			title: "最高評価軸",
			value: getHighestDimension(stats).name,
			score: getHighestDimension(stats).score.toFixed(1),
			icon: "🏆",
			color: "text-purple-600",
			bgColor: "bg-purple-50",
		},
	];

	return (
		<div className="bg-white rounded-lg shadow-sm border">
			<div className="p-6">
				<h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
					<span>📈</span>
					評価統計サマリー
				</h2>

				{/* メインスタッツカード */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
					{statCards.map((card) => (
						<div
							key={card.title}
							className={`${card.bgColor} rounded-lg p-4 border`}
						>
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">
										{card.title}
									</p>
									<div className="flex items-baseline gap-1">
										<p className={`text-2xl font-bold ${card.color}`}>
											{card.value}
										</p>
										{card.unit && (
											<span className="text-sm text-gray-500">{card.unit}</span>
										)}
										{card.score && (
											<span className="text-sm text-gray-500">
												({card.score})
											</span>
										)}
									</div>
									{card.percentage && (
										<p className="text-xs text-gray-500 mt-1">
											{card.percentage}
										</p>
									)}
								</div>
								<div className="text-2xl">{card.icon}</div>
							</div>
						</div>
					))}
				</div>

				{/* 評価軸別詳細 */}
				<div className="bg-gray-50 rounded-lg p-4">
					<h3 className="text-lg font-medium text-gray-900 mb-4">
						評価軸別平均スコア
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-5 gap-3">
						{getDimensionStats(stats).map((dimension) => (
							<div
								key={dimension.name}
								className="bg-white rounded-lg p-3 text-center"
							>
								<div className="flex items-center justify-center gap-1 mb-1">
									<span className={`w-3 h-3 rounded-full ${dimension.color}`} />
									<p className="text-sm font-medium text-gray-700">
										{dimension.name}
									</p>
								</div>
								<p className="text-xl font-bold text-gray-900">
									{dimension.score.toFixed(1)}
								</p>
								<div className="w-full bg-gray-200 rounded-full h-2 mt-2">
									<div
										className={`h-2 rounded-full ${dimension.color}`}
										style={{ width: `${(dimension.score / 10) * 100}%` }}
									/>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * 最高評価軸を取得
 */
function getHighestDimension(stats: RatingStats) {
	const dimensions = getDimensionStats(stats);
	return dimensions.reduce((highest, current) =>
		current.score > highest.score ? current : highest,
	);
}

/**
 * 評価軸統計を取得
 */
function getDimensionStats(stats: RatingStats) {
	return [
		{
			name: "実用性",
			score: stats.averagePracticalValue,
			color: "bg-green-400",
		},
		{
			name: "技術深度",
			score: stats.averageTechnicalDepth,
			color: "bg-blue-400",
		},
		{
			name: "理解度",
			score: stats.averageUnderstanding,
			color: "bg-purple-400",
		},
		{
			name: "新規性",
			score: stats.averageNovelty,
			color: "bg-yellow-400",
		},
		{
			name: "重要度",
			score: stats.averageImportance,
			color: "bg-red-400",
		},
	];
}
