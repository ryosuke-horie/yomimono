/**
 * 評価別未読一覧ページ
 */
"use client";

import { Header } from "@/components/Header";
import { MCPEvaluationGuide } from "@/features/ratings/components/MCPEvaluationGuide";
import { RatingFilters } from "@/features/ratings/components/RatingFilters";
import { RatingStatsSummary } from "@/features/ratings/components/RatingStatsSummary";
import { RatingsList } from "@/features/ratings/components/RatingsList";
import { useRatingStats } from "@/features/ratings/queries/useRatingStats";
import { useRatings } from "@/features/ratings/queries/useRatings";
import type { RatingFilters as RatingFiltersType } from "@/features/ratings/types";
import { useState } from "react";

export default function RatingsPage() {
	const [filters, setFilters] = useState<RatingFiltersType>({
		sortBy: "createdAt",
		order: "desc",
		limit: 20,
	});

	const {
		data: ratings,
		isLoading: isLoadingRatings,
		error: ratingsError,
	} = useRatings(filters);
	const {
		data: stats,
		isLoading: isLoadingStats,
		error: statsError,
	} = useRatingStats();

	const hasError = ratingsError || statsError;

	return (
		<div className="min-h-screen bg-gray-50">
			<Header title="記事評価一覧" />

			<main className="container mx-auto px-4 py-8 max-w-6xl">
				{/* エラー表示 */}
				{hasError && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
						<div className="flex items-center gap-2">
							<span className="text-red-500">⚠️</span>
							<span className="text-red-800 font-medium">
								データの読み込みに失敗しました
							</span>
						</div>
						<p className="text-red-700 text-sm mt-2">
							{ratingsError?.message ||
								statsError?.message ||
								"不明なエラーが発生しました"}
						</p>
					</div>
				)}

				{/* 統計サマリー */}
				<div className="mb-8">
					<RatingStatsSummary stats={stats} isLoading={isLoadingStats} />
				</div>

				{/* フィルター・ソートコントロール */}
				<div className="mb-6">
					<RatingFilters filters={filters} onChange={setFilters} />
				</div>

				{/* 評価一覧 */}
				<div className="mb-8">
					<RatingsList ratings={ratings} isLoading={isLoadingRatings} />
				</div>

				{/* データがない場合のMCPガイド */}
				{!isLoadingRatings &&
					!ratingsError &&
					ratings &&
					ratings.length === 0 && (
						<div className="mt-12">
							<MCPEvaluationGuide />
						</div>
					)}

				{/* データが少ない場合の追加ガイド */}
				{!isLoadingStats &&
					stats &&
					stats.totalCount > 0 &&
					stats.totalCount <= 5 && (
						<div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
							<div className="flex items-center gap-2 mb-2">
								<span className="text-blue-700">💡</span>
								<span className="text-blue-900 font-medium">
									評価データを増やしませんか？
								</span>
							</div>
							<p className="text-blue-800 text-sm">
								現在{stats.totalCount}件の評価があります。
								より多くの記事を評価すると、統計データがより有用になります。
							</p>
						</div>
					)}
			</main>
		</div>
	);
}
