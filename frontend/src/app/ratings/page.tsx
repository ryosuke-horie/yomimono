/**
 * 評価別未読一覧ページ
 * 記事の評価を表示・管理するページ
 */

"use client";

import { useRatingStats } from "@/features/ratings/queries/useRatingStats";
import { useRatings } from "@/features/ratings/queries/useRatings";

export default function RatingsPage() {
	const {
		data: ratings = [],
		isLoading: ratingsLoading,
		error: ratingsError,
	} = useRatings();
	const {
		data: stats,
		isLoading: statsLoading,
		error: statsError,
	} = useRatingStats();

	const isLoading = ratingsLoading || statsLoading;
	const error = ratingsError || statsError;

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-2xl font-bold mb-6">記事評価一覧</h1>

			{/* エラー状態 */}
			{error && (
				<div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
					<p className="font-semibold">データの読み込みに失敗しました</p>
					<p className="text-sm mt-1">{error.message}</p>
				</div>
			)}

			{/* ローディング状態 */}
			{isLoading && (
				<div className="text-center py-8">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
				</div>
			)}

			{/* データが少ない場合のガイド */}
			{!isLoading && stats && stats.totalCount < 10 && stats.totalCount > 0 && (
				<div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
					<p className="font-semibold">評価データを増やしませんか？</p>
					<p className="text-sm mt-1">
						現在{stats.totalCount}件の評価があります。
					</p>
				</div>
			)}

			{/* 空状態 */}
			{!isLoading && ratings.length === 0 && (
				<div className="text-center py-12">
					<p className="text-gray-600 mb-4">評価済み記事がありません</p>
				</div>
			)}

			{/* 評価一覧 */}
			{!isLoading && ratings.length > 0 && (
				<div className="space-y-4">
					{ratings.map((item) => (
						<div
							key={item.rating.id}
							className="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow"
						>
							<h3 className="font-semibold text-lg mb-2">
								{item.article.title}
							</h3>
							<div className="flex items-center gap-4 text-sm text-gray-600">
								<span>総合評価: {item.rating.totalScore}</span>
								<span>実用性: {item.rating.practicalValue}</span>
								<span>技術的深さ: {item.rating.technicalDepth}</span>
							</div>
							{item.rating.comment && (
								<p className="mt-2 text-gray-700">{item.rating.comment}</p>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
