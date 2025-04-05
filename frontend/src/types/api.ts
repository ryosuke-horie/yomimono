import type { Bookmark } from "./bookmark";

interface ApiError {
	code: string;
	message: string;
}

interface ApiResponse<T> {
	success: boolean;
	bookmarks?: T[];
	totalUnread?: number;
	message?: string;
	error?: ApiError;
}

export type ApiBookmarkResponse = ApiResponse<Bookmark>;
export type ApiFavoriteResponse = ApiResponse<Bookmark>;
