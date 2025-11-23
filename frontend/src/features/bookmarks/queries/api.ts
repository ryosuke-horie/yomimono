import type { Bookmark, BookmarkWithLabel } from "@/features/bookmarks/types";
import type { Label } from "@/features/labels/types";
import { API_BASE_URL } from "@/lib/api/config";
import { ApiError, createApiError } from "@/lib/api/errors";
import type { ApiBookmarkResponse, ApiResponse } from "@/types/api";

// --- Query Functions ---

export interface BookmarksData {
	bookmarks: Bookmark[];
	totalUnread: number;
	todayReadCount: number;
}

interface RecentBookmarksApiResponse {
	success: boolean;
	bookmarks: { [date: string]: BookmarkWithLabel[] };
}

export const getRecentlyReadBookmarks = async (): Promise<{
	[date: string]: BookmarkWithLabel[];
}> => {
	const url = `${API_BASE_URL}/api/bookmarks/recent`;
	const response = await fetch(url, {
		headers: { Accept: "application/json", "Content-Type": "application/json" },
	});
	const responseText = await response.text();
	if (!response.ok)
		throw createApiError(
			response,
			`Failed to fetch recently read bookmarks: ${response.status}`,
		);
	try {
		const data = JSON.parse(responseText);
		// success フラグで成功/失敗を判断
		if (!data.success) {
			// エラーレスポンスとして型アサーション (ApiResponse<unknown> を使用)
			const errorData = data as ApiResponse<unknown>;
			throw new ApiError(
				errorData.message || "Unknown error fetching recent bookmarks",
				"API_ERROR",
				errorData,
			);
		}
		// 成功レスポンスとして型アサーション
		const successData = data as RecentBookmarksApiResponse;
		return successData.bookmarks || {};
	} catch (e) {
		// 既にApiErrorの場合はそのまま再スロー
		if (e instanceof ApiError) throw e;
		// パースエラーの場合はApiErrorでラップ
		throw new ApiError("Invalid response format", "PARSE_ERROR", {
			originalError: e,
			responseText,
		});
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
		throw createApiError(
			response,
			`Failed to mark as read: ${response.status}`,
		);
	try {
		const data = JSON.parse(responseText) as ApiBookmarkResponse;
		if (!data.success)
			throw new ApiError(data.message || "Operation failed", "API_ERROR", data);
	} catch (e) {
		// 既にApiErrorの場合はそのまま再スロー
		if (e instanceof ApiError) throw e;
		// パースエラーの場合はApiErrorでラップ
		throw new ApiError("Invalid response format", "PARSE_ERROR", {
			originalError: e,
			responseText,
		});
	}
};

export const markBookmarkAsUnread = async (id: number): Promise<void> => {
	const url = `${API_BASE_URL}/api/bookmarks/${id}/unread`;
	const response = await fetch(url, {
		method: "PATCH",
		headers: { Accept: "application/json", "Content-Type": "application/json" },
	});
	const responseText = await response.text();
	if (!response.ok)
		throw createApiError(
			response,
			`Failed to mark as unread: ${response.status}`,
		);
	try {
		const data = JSON.parse(responseText) as ApiBookmarkResponse;
		if (!data.success)
			throw new ApiError(data.message || "Operation failed", "API_ERROR", data);
	} catch (e) {
		// 既にApiErrorの場合はそのまま再スロー
		if (e instanceof ApiError) throw e;
		// パースエラーの場合はApiErrorでラップ
		throw new ApiError("Invalid response format", "PARSE_ERROR", {
			originalError: e,
			responseText,
		});
	}
};

export const addBookmarkToFavorites = async (id: number): Promise<void> => {
	const url = `${API_BASE_URL}/api/bookmarks/${id}/favorite`;
	const response = await fetch(url, {
		method: "POST",
		headers: { Accept: "application/json", "Content-Type": "application/json" },
	});
	if (!response.ok)
		throw createApiError(
			response,
			`Failed to add to favorites: ${response.status}`,
		);
	const data = (await response.json()) as ApiBookmarkResponse;
	if (!data.success)
		throw new ApiError(data.message || "Operation failed", "API_ERROR", data);
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
		throw createApiError(
			response,
			`Failed to remove from favorites: ${response.status}`,
		);
	const data = (await response.json()) as ApiBookmarkResponse;
	if (!data.success)
		throw new ApiError(data.message || "Operation failed", "API_ERROR", data);
};

export const createBookmark = async (data: {
	title: string;
	url: string;
}): Promise<void> => {
	const url = `${API_BASE_URL}/api/bookmarks/bulk`;

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			bookmarks: [data],
		}),
	});

	if (!response.ok) {
		const errorData = (await response.json()) as ApiResponse<unknown>;
		throw createApiError(
			response,
			errorData.message || "Failed to create bookmark",
			errorData,
		);
	}
};

export const assignLabelToBookmark = async (
	bookmarkId: number,
	labelName: string,
): Promise<Label> => {
	const url = `${API_BASE_URL}/api/bookmarks/${bookmarkId}/label`;

	const response = await fetch(url, {
		method: "PUT",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ labelName }),
	});

	const responseText = await response.text();

	if (!response.ok) {
		throw createApiError(
			response,
			`Failed to assign label: ${response.status}`,
			responseText,
		);
	}

	try {
		const data = JSON.parse(responseText) as ApiResponse<Label> & {
			label?: Label;
		};

		if (!data.success || !data.label) {
			throw new ApiError(
				data.message || "Failed to assign label",
				"API_ERROR",
				data,
			);
		}

		return data.label;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}

		throw new ApiError("Invalid response format", "PARSE_ERROR", {
			originalError: error,
			responseText,
		});
	}
};
