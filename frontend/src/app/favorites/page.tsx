"use client";

import { useQuery } from "@tanstack/react-query";
import { BookmarksList } from "@/features/bookmarks/components/BookmarksList";
import type { BookmarkWithLabel } from "@/features/bookmarks/types";
import { API_BASE_URL } from "@/lib/api/config";

// APIレスポンスの型定義
interface FavoritesApiResponse {
	success: boolean;
	bookmarks: BookmarkWithLabel[];
}

// お気に入りブックマーク一覧を取得する非同期関数
const fetchFavoriteBookmarks = async (): Promise<FavoritesApiResponse> => {
	const response = await fetch(`${API_BASE_URL}/api/bookmarks/favorites`);
	if (!response.ok) {
		throw new Error("Failed to fetch favorite bookmarks");
	}
	const data: FavoritesApiResponse = await response.json();
	return data;
};

export default function FavoritesPage() {
	// お気に入りブックマーク取得
	const {
		data: responseData,
		isLoading,
		error,
	} = useQuery<FavoritesApiResponse, Error>({
		queryKey: ["bookmarks", "favorites"], // クエリキーを設定
		queryFn: fetchFavoriteBookmarks,
		staleTime: 1 * 60 * 1000, // 1分間キャッシュを有効にする
	});

	// 取得したデータからブックマークリストを抽出
	const bookmarks = responseData?.bookmarks ?? [];

	// エラーハンドリング
	if (error) {
		return (
			<main className="container mx-auto px-4 py-8 text-red-500">
				お気に入りブックマークの読み込みに失敗しました: {error.message}
			</main>
		);
	}

	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="text-2xl font-bold mb-6">お気に入り</h1>
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{/* スケルトンローディング表示 */}
					{[...Array(6)].map((_, i) => (
						<div
							key={i}
							className="border rounded-lg p-4 h-[150px] bg-gray-100 animate-pulse"
						/>
					))}
				</div>
			) : (
				<BookmarksList bookmarks={bookmarks} />
				/* ラベルクリック時のフィルタリングはホームページのみのため onLabelClick は渡さない */
			)}
		</main>
	);
}
