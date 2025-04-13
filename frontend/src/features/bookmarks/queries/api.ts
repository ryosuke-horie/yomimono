import type { Bookmark, BookmarkWithLabel } from "@/features/bookmarks/types"; // BookmarkWithLabel をインポート
import { API_BASE_URL } from "@/lib/api/config";
import type {
	ApiBookmarkResponse,
	ApiFavoriteResponse,
	ApiResponse, // 汎用レスポンス型をインポート
} from "@/types/api";

// --- Query Functions ---

export interface BookmarksData {
	// export を追加
	bookmarks: Bookmark[];
	totalUnread: number;
	todayReadCount: number;
}

// APIレスポンスの型定義を追加
interface RecentBookmarksApiResponse {
	success: boolean;
	bookmarks: { [date: string]: BookmarkWithLabel[] }; // 型を BookmarkWithLabel に修正
}

export const getRecentlyReadBookmarks = async (): Promise<{
	[date: string]: BookmarkWithLabel[]; // 戻り値の型を修正
}> => {
	const url = `${API_BASE_URL}/api/bookmarks/recent`;
	const response = await fetch(url, {
		headers: { Accept: "application/json", "Content-Type": "application/json" },
	});
	const responseText = await response.text();
	if (!response.ok)
		throw new Error(
			`Failed to fetch recently read bookmarks: ${response.status}`,
		);
	try {
		const data = JSON.parse(responseText);
		// success フラグで成功/失敗を判断
		if (!data.success) {
			// エラーレスポンスとして型アサーション (ApiResponse<unknown> を使用)
			const errorData = data as ApiResponse<unknown>;
			throw new Error(
				errorData.message || "Unknown error fetching recent bookmarks",
			);
		}
		// 成功レスポンスとして型アサーション
		const successData = data as RecentBookmarksApiResponse;
		return successData.bookmarks || {};
	} catch (e) {
		console.error("Failed to parse response:", e, { responseText });
		throw new Error("Invalid response format");
	}
};

// --- Mutation Functions ---

export const markBookmarkAsRead = async (id: number): Promise<void> => {
	const url = `${API_BASE_URL}/api/bookmarks/${id}/read`;
	const response = await fetch(url, {
		method: "PATCH",
		headers: { Accept: "application/json", "Content-Type": "application/json" },
	});
	const responseText = await response.text();
	if (!response.ok)
		throw new Error(`Failed to mark as read: ${response.status}`);
	try {
		const data = JSON.parse(responseText) as ApiBookmarkResponse;
		if (!data.success) throw new Error(data.message);
	} catch (e) {
		console.error("Failed to parse response:", e, { responseText });
		throw new Error("Invalid response format");
	}
};

export const addBookmarkToFavorites = async (id: number): Promise<void> => {
	const url = `${API_BASE_URL}/api/bookmarks/${id}/favorite`;
	const response = await fetch(url, {
		method: "POST",
		headers: { Accept: "application/json", "Content-Type": "application/json" },
	});
	if (!response.ok)
		throw new Error(`Failed to add to favorites: ${response.status}`);
	const data = (await response.json()) as ApiBookmarkResponse;
	if (!data.success) throw new Error(data.message);
};

export const removeBookmarkFromFavorites = async (
	id: number,
): Promise<void> => {
	const url = `${API_BASE_URL}/api/bookmarks/${id}/favorite`;
	const response = await fetch(url, {
		method: "DELETE",
		headers: { Accept: "application/json", "Content-Type": "application/json" },
	});
	if (!response.ok)
		throw new Error(`Failed to remove from favorites: ${response.status}`);
	const data = (await response.json()) as ApiBookmarkResponse;
	if (!data.success) throw new Error(data.message);
};
