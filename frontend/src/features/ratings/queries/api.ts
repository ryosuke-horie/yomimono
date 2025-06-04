/**
 * 記事評価ポイント機能のAPI通信
 */
import type {
	ArticleRating,
	CreateRatingData,
	RatingFilters,
	RatingStats,
	RatingWithArticle,
	UpdateRatingData,
} from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	errors?: Array<{ message: string }>;
}

interface RatingsListResponse {
	success: boolean;
	ratings: RatingWithArticle[];
	count: number;
}

interface RatingStatsResponse {
	success: boolean;
	stats: RatingStats;
}

interface SingleRatingResponse {
	success: boolean;
	rating: ArticleRating;
}

/**
 * 評価一覧を取得
 */
export const fetchRatings = async (
	filters?: RatingFilters,
): Promise<RatingWithArticle[]> => {
	const params = new URLSearchParams();

	if (filters) {
		if (filters.sortBy) params.append("sortBy", filters.sortBy);
		if (filters.order) params.append("order", filters.order);
		if (filters.limit) params.append("limit", filters.limit.toString());
		if (filters.offset) params.append("offset", filters.offset.toString());
		if (filters.minScore)
			params.append("minScore", filters.minScore.toString());
		if (filters.maxScore)
			params.append("maxScore", filters.maxScore.toString());
		if (filters.hasComment !== undefined)
			params.append("hasComment", filters.hasComment.toString());
	}

	const url = `${API_BASE_URL}/api/ratings${
		params.toString() ? `?${params.toString()}` : ""
	}`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`評価一覧の取得に失敗しました: ${response.statusText}`);
	}

	const data: RatingsListResponse = await response.json();
	if (!data.success) {
		throw new Error(data.message || "評価一覧の取得に失敗しました");
	}

	return data.ratings;
};

/**
 * 評価統計情報を取得
 */
export const fetchRatingStats = async (): Promise<RatingStats> => {
	const response = await fetch(`${API_BASE_URL}/api/ratings/stats`);
	if (!response.ok) {
		throw new Error(`評価統計の取得に失敗しました: ${response.statusText}`);
	}

	const data: RatingStatsResponse = await response.json();
	if (!data.success) {
		throw new Error(data.message || "評価統計の取得に失敗しました");
	}

	return data.stats;
};

/**
 * 記事の評価を取得
 */
export const fetchArticleRating = async (
	articleId: number,
): Promise<ArticleRating | null> => {
	const response = await fetch(
		`${API_BASE_URL}/api/bookmarks/${articleId}/rating`,
	);

	if (response.status === 404) {
		return null; // 評価が存在しない場合
	}

	if (!response.ok) {
		throw new Error(`評価の取得に失敗しました: ${response.statusText}`);
	}

	const data: SingleRatingResponse = await response.json();
	if (!data.success) {
		throw new Error(data.message || "評価の取得に失敗しました");
	}

	return data.rating;
};

/**
 * 記事の評価を作成
 */
export const createRating = async (
	articleId: number,
	ratingData: CreateRatingData,
): Promise<ArticleRating> => {
	const response = await fetch(
		`${API_BASE_URL}/api/bookmarks/${articleId}/rating`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(ratingData),
		},
	);

	if (!response.ok) {
		throw new Error(`評価の作成に失敗しました: ${response.statusText}`);
	}

	const data: SingleRatingResponse = await response.json();
	if (!data.success) {
		throw new Error(data.message || "評価の作成に失敗しました");
	}

	return data.rating;
};

/**
 * 記事の評価を更新
 */
export const updateRating = async (
	articleId: number,
	ratingData: UpdateRatingData,
): Promise<ArticleRating> => {
	const response = await fetch(
		`${API_BASE_URL}/api/bookmarks/${articleId}/rating`,
		{
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(ratingData),
		},
	);

	if (!response.ok) {
		throw new Error(`評価の更新に失敗しました: ${response.statusText}`);
	}

	const data: SingleRatingResponse = await response.json();
	if (!data.success) {
		throw new Error(data.message || "評価の更新に失敗しました");
	}

	return data.rating;
};

/**
 * 記事の評価を削除
 */
export const deleteRating = async (articleId: number): Promise<void> => {
	const response = await fetch(
		`${API_BASE_URL}/api/bookmarks/${articleId}/rating`,
		{
			method: "DELETE",
		},
	);

	if (!response.ok) {
		throw new Error(`評価の削除に失敗しました: ${response.statusText}`);
	}

	const data: ApiResponse<void> = await response.json();
	if (!data.success) {
		throw new Error(data.message || "評価の削除に失敗しました");
	}
};
