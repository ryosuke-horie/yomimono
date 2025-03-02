import type { Bookmark } from "./bookmark";

export interface ApiError {
	code: string;
	message: string;
}

export interface ApiResponse<T> {
	success: boolean;
	bookmarks?: T[];
	message?: string;
	error?: ApiError;
}

export type ApiBookmarkResponse = ApiResponse<Bookmark>;
