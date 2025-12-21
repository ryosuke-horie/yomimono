import {
	deleteApiBookmarksIdFavorite,
	getApiBookmarks,
	getApiBookmarksFavorites,
	getApiBookmarksRecent,
	patchApiBookmarksIdRead,
	patchApiBookmarksIdUnread,
	postApiBookmarksBulk,
	postApiBookmarksIdFavorite,
	putApiBookmarksIdLabel,
} from "@/lib/openapi/browser";
import type {
	AssignLabelResponse,
	BookmarkListResponse,
	ErrorResponse,
	FavoriteBookmarksResponse,
	MessageResponse,
	RecentBookmarksResponse,
	SuccessResponse,
} from "@/lib/openapi/browser/schemas";

type ApiResult<T> = { data: T; status: number };

function unwrapResponse<T extends { success: boolean }>(
	response: ApiResult<T> | ApiResult<ErrorResponse>,
	fallbackMessage: string,
): T {
	const { data, status } = response;
	const success = (data as { success?: boolean }).success;

	if (success && status < 400) {
		return data as T;
	}

	const message =
		(data as ErrorResponse).message ??
		(status ? `${fallbackMessage}: ${status}` : fallbackMessage);

	throw new Error(message);
}

export const getBookmarks = async (label?: string): Promise<BookmarksData> => {
	const response = await getApiBookmarks(label ? { label } : undefined);
	return unwrapResponse<BookmarkListResponse>(
		response,
		"ブックマークの取得に失敗しました",
	);
};

export const getFavoriteBookmarks = async (): Promise<FavoritesData> => {
	const response = await getApiBookmarksFavorites();
	return unwrapResponse<FavoriteBookmarksResponse>(
		response,
		"お気に入りの取得に失敗しました",
	);
};

export const getRecentlyReadBookmarks = async (): Promise<
	RecentBookmarksResponse["bookmarks"]
> => {
	const response = await getApiBookmarksRecent();
	const data = unwrapResponse<RecentBookmarksResponse>(
		response,
		"最近読んだブックマークの取得に失敗しました",
	);
	return data.bookmarks;
};

export const markBookmarkAsRead = async (id: number): Promise<void> => {
	const response = await patchApiBookmarksIdRead(id);
	unwrapResponse<SuccessResponse>(response, "既読処理に失敗しました");
};

export const markBookmarkAsUnread = async (id: number): Promise<void> => {
	const response = await patchApiBookmarksIdUnread(id);
	unwrapResponse<SuccessResponse>(response, "未読への戻しに失敗しました");
};

export const addBookmarkToFavorites = async (id: number): Promise<void> => {
	const response = await postApiBookmarksIdFavorite(id);
	unwrapResponse<SuccessResponse>(response, "お気に入り追加に失敗しました");
};

export const removeBookmarkFromFavorites = async (
	id: number,
): Promise<void> => {
	const response = await deleteApiBookmarksIdFavorite(id);
	unwrapResponse<SuccessResponse>(
		response,
		"お気に入りからの削除に失敗しました",
	);
};

export const createBookmark = async (data: {
	title: string;
	url: string;
}): Promise<void> => {
	const response = await postApiBookmarksBulk({
		bookmarks: [data],
	});
	unwrapResponse<MessageResponse>(response, "ブックマーク作成に失敗しました");
};

export const assignLabelToBookmark = async (
	bookmarkId: number,
	labelName: string,
): Promise<AssignLabelResponse["label"]> => {
	const response = await putApiBookmarksIdLabel(bookmarkId, { labelName });
	const data = unwrapResponse<AssignLabelResponse>(
		response,
		"ラベル付与に失敗しました",
	);
	return data.label;
};

export type BookmarksData = BookmarkListResponse;
export type FavoritesData = FavoriteBookmarksResponse;
