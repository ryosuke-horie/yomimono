/**
 * ブックマークカードの評価表示コンポーネント
 * useArticleRatingを内包し、必要な場合のみAPI呼び出しを行う
 */
"use client";

import { StarRating } from "@/features/ratings/components/StarRating";
import { useArticleRating } from "@/features/ratings/queries/useArticleRating";
import Link from "next/link";

interface Props {
	bookmarkId: number;
}

export function RatingDisplay({ bookmarkId }: Props) {
	const { data: rating } = useArticleRating(bookmarkId);

	// 評価がない場合は何も表示しない
	if (!rating) {
		return null;
	}

	return (
		<div className="absolute bottom-10 right-24">
			<div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-sm">
				<StarRating score={rating.totalScore} size="sm" />
				<Link
					href={`/ratings?articleId=${bookmarkId}`}
					className="text-xs text-blue-600 hover:text-blue-700 ml-1"
					title="評価詳細を見る"
				>
					詳細
				</Link>
			</div>
		</div>
	);
}
