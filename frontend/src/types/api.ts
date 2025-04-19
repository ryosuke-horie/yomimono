import type { Bookmark } from "@/features/bookmarks/types";

interface ApiError {
	code: string;
	message: string;
}

export interface ApiResponse<T> {
	// export を追加
	success: boolean;
	bookmarks?: T[];
	totalUnread?: number;
	todayReadCount?: number;
	message?: string;
	error?: ApiError;
}

export type ApiBookmarkResponse = ApiResponse<Bookmark>;
