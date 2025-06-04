/**
 * 評価一覧表示コンポーネント
 */
"use client";

import Link from "next/link";
import type { RatingWithArticle } from "../types";
import { MCPEvaluationGuide } from "./MCPEvaluationGuide";
import { StarRating } from "./StarRating";

interface Props {
	ratings?: RatingWithArticle[];
	isLoading?: boolean;
}

export function RatingsList({ ratings = [], isLoading = false }: Props) {
	if (isLoading) {
		return (
			<div className="space-y-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={`loading-${i}`}
						className="bg-white rounded-lg shadow-sm border p-6"
					>
						<div className="animate-pulse">
							<div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
							<div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
							<div className="flex gap-4 mb-3">
								<div className="h-8 bg-gray-200 rounded w-24" />
								<div className="h-4 bg-gray-200 rounded w-32" />
							</div>
							<div className="h-16 bg-gray-200 rounded mb-2" />
							<div className="h-4 bg-gray-200 rounded w-1/4" />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (ratings.length === 0) {
		return (
			<div className="text-center py-12">
				<div className="mb-8">
					<span className="text-6xl mb-4 block">📊</span>
					<h3 className="text-xl font-medium text-gray-900 mb-2">
						評価済み記事がありません
					</h3>
					<p className="text-gray-600 mb-6">
						条件に一致する評価済み記事がありません。
						<br />
						Claude (MCP) で記事を評価してください。
					</p>
				</div>
				<MCPEvaluationGuide compact />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{ratings.map((item) => (
				<RatingItem key={item.rating.id} item={item} />
			))}
		</div>
	);
}

/**
 * 個別の評価アイテムコンポーネント
 */
function RatingItem({ item }: { item: RatingWithArticle }) {
	const { rating, article } = item;

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("ja-JP", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getDimensionColor = (dimension: string) => {
		const colors = {
			practicalValue: "bg-green-100 text-green-800",
			technicalDepth: "bg-blue-100 text-blue-800",
			understanding: "bg-purple-100 text-purple-800",
			novelty: "bg-yellow-100 text-yellow-800",
			importance: "bg-red-100 text-red-800",
		};
		return (
			colors[dimension as keyof typeof colors] || "bg-gray-100 text-gray-800"
		);
	};

	const dimensions = [
		{ key: "practicalValue", name: "実用性", value: rating.practicalValue },
		{ key: "technicalDepth", name: "技術深度", value: rating.technicalDepth },
		{ key: "understanding", name: "理解度", value: rating.understanding },
		{ key: "novelty", name: "新規性", value: rating.novelty },
		{ key: "importance", name: "重要度", value: rating.importance },
	];

	return (
		<article className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
			<div className="p-6">
				{/* 記事情報 */}
				<div className="mb-4">
					<h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
						<a
							href={article.url}
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-blue-600 transition-colors"
							title={article.title || "タイトルなし"}
						>
							{article.title || "タイトルなし"}
						</a>
					</h3>
					<div className="flex items-center gap-4 text-sm text-gray-600">
						<span className="truncate flex-1" title={article.url}>
							{article.url}
						</span>
						<span className="whitespace-nowrap">
							{formatDate(article.createdAt)}
						</span>
					</div>
				</div>

				{/* 評価表示 */}
				<div className="bg-gray-50 rounded-lg p-4 mb-4">
					{/* 総合スコア */}
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-3">
							<span className="text-sm font-medium text-gray-700">
								総合評価
							</span>
							<StarRating score={rating.totalScore} size="md" showNumber />
						</div>
						<div className="text-right">
							<span className="text-xs text-gray-500">
								評価日: {formatDate(rating.createdAt)}
							</span>
						</div>
					</div>

					{/* 評価軸詳細 */}
					<div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
						{dimensions.map((dimension) => (
							<div
								key={dimension.key}
								className={`${getDimensionColor(dimension.key)} px-3 py-2 rounded-lg text-center`}
							>
								<div className="text-xs font-medium">{dimension.name}</div>
								<div className="text-lg font-bold">{dimension.value}</div>
							</div>
						))}
					</div>

					{/* コメント */}
					{rating.comment && (
						<div className="border-t border-gray-200 pt-3">
							<div className="flex items-start gap-2">
								<span className="text-lg">💭</span>
								<div className="flex-1">
									<p className="text-sm text-gray-700 leading-relaxed">
										{rating.comment}
									</p>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* アクション */}
				<div className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-3">
						<span
							className={`px-2 py-1 rounded-full text-xs ${
								article.isRead
									? "bg-green-100 text-green-800"
									: "bg-orange-100 text-orange-800"
							}`}
						>
							{article.isRead ? "既読" : "未読"}
						</span>
						<Link
							href={`/bookmarks?id=${article.id}`}
							className="text-blue-600 hover:text-blue-700"
						>
							記事詳細
						</Link>
					</div>
					<div className="flex items-center gap-2 text-gray-500">
						<span>記事ID: {article.id}</span>
						<button
							type="button"
							onClick={() => {
								navigator.clipboard.writeText(article.url);
							}}
							className="hover:text-gray-700"
							title="URLをコピー"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>
		</article>
	);
}
